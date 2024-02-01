import {
    Accordion, AccordionDetails, AccordionSummary, Box,
    Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, IconButton,
    InputAdornment, InputLabel, MenuItem, Slider, Stack,
    styled,
    TextField, Tooltip,
    Typography
} from "@mui/material"
import LoadingSpinner from "./LoadingSpinner.jsx"
import React, {useEffect, useState} from "react"
import Grid from "@mui/material/Unstable_Grid2"
import {Textsms, AddCircle, DeleteForever, Info, CheckCircle, Close} from "@mui/icons-material"
import Markdown from "./Markdown.jsx"
import {AddPhotoAlternate, ClearAll, ArrowDropDown, IosShare, Edit} from "@mui/icons-material/"

const TextPart = ({part, edit = false, handlePartTextChange, handleEditEnd}) => {
    const [text, setText] = useState(part.text.replace("\n\n", "\n"))
    const handleEditCommit = () => {
        handlePartTextChange(text.replace("\n", "\n\n"))
        handleEditEnd()
    }

    const handleKeyPress = (e) => {
        if (e.keyCode === 13) {
            if (e.shiftKey) return
            handleEditCommit()
            return
        }

        if (e.keyCode === 27) {
            handleEditEnd()
            return
        }
    }

    if (edit) return (
        <Box>
            <TextField multiline
                       fullWidth
                       value={text}
                       onChange={(e)=>setText(e.target.value)}
                       onKeyDown={handleKeyPress}
                       InputProps={{
                           endAdornment: (
                               <InputAdornment position='end'>
                                   <IconButton onClick={handleEditCommit}><CheckCircle/></IconButton>
                                   <IconButton onClick={handleEditEnd}><Close/></IconButton>
                               </InputAdornment>
                           ),
                       }}/>

        </Box>
    )

    return (
        <Markdown markdown={part.text}/>
    )
}

const ImagePart = ({part}) => (
    <img src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
         style={{maxWidth: "100px", maxHeight: "100px"}}
         alt="input image"
    />
)

const PromptPart = ({part, edit = false, handlePartTextChange, handleEditEnd}) => {
    if (part.text !== undefined) return <TextPart part={part} edit={edit} handlePartTextChange={handlePartTextChange} handleEditEnd={handleEditEnd}/>
    if (part.inlineData) return  <ImagePart part={part}/>
    return <></>
}

const PromptBuilderPart = ({part, index, deletePromptItem, handleBuilderPartTextChange}) => {
    const [edit, setEdit] = useState(false)

    return (
        <>
            <Grid xs={2}>
            </Grid>
            <Grid xs={8}>
                <PromptPart part={part} edit={edit} handlePartTextChange={handleBuilderPartTextChange(index)} handleEditEnd={()=>setEdit(false)}/>
            </Grid>
            <Grid xs={2}>
                <IconButton onClick={deletePromptItem(index)}><DeleteForever/></IconButton>
                {part.text !== undefined && !edit && <IconButton onClick={() => setEdit(!edit)}><Edit/></IconButton>}
            </Grid>
        </>
    )
}

const PromptHistoryItem = (props) => {
    return props.item.parts.map((part, partIndex) =>
        <PromptHistoryPart {...props} part={part} partIndex={partIndex}/>
    )
}

const PromptHistoryPart = ({item, itemIndex, part, partIndex, deleteHistoryPart, handleHistoryPartTextChange}) => {
    const [edit, setEdit] = useState(false)

    return (
        <>
            <Grid xs={2}>
                {item.role && partIndex === 0 && <Typography variant="subtitle2">{item.role.toUpperCase()}</Typography>}
            </Grid>
            <Grid xs={8}>
                <PromptPart part={part} edit={edit} handlePartTextChange={handleHistoryPartTextChange(itemIndex, partIndex)} handleEditEnd={()=>setEdit(false)}/>
            </Grid>
            <Grid xs={2}>
                <IconButton onClick={deleteHistoryPart(itemIndex, partIndex)}><DeleteForever/></IconButton>
                {part.text !== undefined && !edit && <IconButton onClick={() => setEdit(!edit)}><Edit/></IconButton>}
            </Grid>
        </>
    )
}

const ShareDialog = ({open, handleClose, serialiseState, deserialiseState}) => {
    const [shareCode, setShareCode] = useState("")
    const [copiedState, setCopiedState] = useState(false)

    const copyState = () => {
        const serialised = serialiseState()
        setCopiedState(true)
        setTimeout(() => setCopiedState(false), 5000)
        return navigator.clipboard.writeText(serialised)
    }

    const importState = () => {
        if (shareCode.length === 0) return
        deserialiseState(shareCode)
        handleClose()
    }

    const handleShareCodeChange = (e) => {
        setShareCode(e.target.value)
    }

    const handleShareCodeSubmit = (e) => {
        if (e.keyCode === 13) importState()
    }

    return (<>
        <Dialog
            open={open}
            onClose={handleClose}
        >
            <DialogTitle>Share</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Paste a shared prompt in here and press IMPORT, or press COPY to put a share code in your clipboard.
                    Prompts with images in are too big to share in this way.
                    <Typography sx={{color: "orange"}}><strong>Pressing IMPORT will erase any work you have in the
                        current prompt.</strong></Typography>
                </DialogContentText>
                <TextField
                    autoFocus
                    required
                    margin="dense"
                    id="name"
                    name="email"
                    label="Share Code"
                    type="email"
                    fullWidth
                    variant="standard"
                    onChange={handleShareCodeChange}
                    onKeyDown={handleShareCodeSubmit}
                />
            </DialogContent>
            <DialogActions sx={{justifyContent: "space-between"}}>
                <Button onClick={copyState}
                        disabled={copiedState}
                        variant="outlined"
                >
                    {copiedState ? "Copied!" : "Copy"}
                </Button>
                <Box>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={importState} variant="contained">Import</Button>
                </Box>
            </DialogActions>
        </Dialog>
    </>)
}

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
})

function Gemini() {
    const [loading, setLoading] = useState(false)
    const [history, setHistory] = useState([])
    const [parts, setParts] = useState([])
    const [text, setText] = useState("")
    const [error, setError] = useState("")
    const [upload, setUpload] = useState(false)
    const [temperature, setTemperature] = useState(0.9)
    const [topP, setTopP] = useState(1.0)
    const [topK, setTopK] = useState(32)
    const [sexuallyExplicitThreshold, setSexuallyExplicitThreshold] = useState("BLOCK_LOW_AND_ABOVE")
    const [hateSpeechThreshold, setHateSpeechThreshold] = useState("BLOCK_LOW_AND_ABOVE")
    const [harassmentThreshold, setHarassmentThreshold] = useState("BLOCK_LOW_AND_ABOVE")
    const [dangerousContentThreshold, setDangerousContentThreshold] = useState("BLOCK_LOW_AND_ABOVE")
    const [shareDialogOpen, setShareDialogOpen] = useState(false)
    const [dirty, setDirty] = useState(false)

    const serialiseState = () => {
        return btoa(JSON.stringify({
            history,
            parts,
            temperature,
            topK,
            topP,
            sexuallyExplicitThreshold,
            hateSpeechThreshold,
            harassmentThreshold,
            dangerousContentThreshold,
        }))
    }

    const deserialiseState = (state) => {
        const j = JSON.parse(atob(state))
        setHistory(j.history)
        setParts(j.parts)
        setTemperature(j.temperature)
        setTopK(j.topK)
        setTopP(j.topP)
        setSexuallyExplicitThreshold(j.sexuallyExplicitThreshold)
        setHateSpeechThreshold(j.hateSpeechThreshold)
        setHarassmentThreshold(j.harassmentThreshold)
        setDangerousContentThreshold(j.dangerousContentThreshold)
    }

    const generateText = async () => {
        if (parts.length === 0) return
        const rq = {
            contents: history,
            generationConfig: {temperature, topP, topK},
            safetySettings: [
                {category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: sexuallyExplicitThreshold},
                {category: "HARM_CATEGORY_HATE_SPEECH", threshold: hateSpeechThreshold},
                {category: "HARM_CATEGORY_HARASSMENT", threshold: harassmentThreshold},
                {category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: dangerousContentThreshold}
            ]
        }
        try {
            const rs = await fetch("/api/generate-text", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(rq)
            })
            if (!rs.ok) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error(await rs.text())
            }
            setLoading(false)

            const body = await rs.json()

            history.push(body)
            setHistory([...history])
        } catch (err) {
            setError(err.message)
            setLoading(false)
        }
    }

    const onFormSubmit = async (e) => {
        e.preventDefault()
        if (text.length > 0) await submitText()
        history.push({role: "USER", parts})
        setHistory([...history])
        setText("")
        setLoading(true)
        setError("")
        setParts([])
        setDirty(false)
        return generateText()
    }

    const deletePromptItem = (index) => () => {
        parts.splice(index, 1)
        setParts([...parts])
    }

    const deleteHistoryPart = (itemIndex, partIndex) => () => {
        const p = history[itemIndex].parts
        p.splice(partIndex, 1)
        if (p.length === 0) history.splice(itemIndex, 1)
        setHistory([...history])
        setDirty(true)
    }

    const submitText = async (e) => {
        if (e?.keyCode === 13 && text.length === 0 && parts.length > 0 && !e.shiftKey) {
            e.preventDefault()
            return onFormSubmit(e)
        }
        if ((e?.keyCode !== 13 && e?.keyCode !== undefined) || text.length === 0) return
        if (e?.keyCode === 13 && e?.shiftKey) return

        e.preventDefault()
        parts.push({text: text.replace(/\n/g, "\n\n")})
        setParts([...parts])
        setText("")
    }

    const handleUploadClick = (e) => {
        const file = e?.target?.files?.[0]
        if (file === undefined) return

        const reader = new FileReader()
        reader.addEventListener("load", () => setUpload(reader.result), false)
        reader.readAsDataURL(file)
    }

    const harmCategories = () => {
        return [
            <MenuItem value="BLOCK_LOW_AND_ABOVE">Strong blocking (block "Low" and above)</MenuItem>,
            <MenuItem value="BLOCK_MED_AND_ABOVE">Medium blocking (block "Medium" and above)</MenuItem>,
            <MenuItem value="BLOCK_HIGH_AND_ABOVE">Weak blocking (block "High" and above)</MenuItem>,
            <MenuItem value="BLOCK_NONE">No blocking (allow all)</MenuItem>,
        ];
    }

    const clearAll = () => {
        setParts([])
        setHistory([])
        setError("")
    }

    const handleBuilderPartTextChange = (partIndex) => (text) => {
        parts[partIndex].text = text
        setParts([...parts])
        setDirty(true)
    }

    const handleHistoryPartTextChange = (itemIndex, partIndex) => (text) => {
        history[itemIndex].parts[partIndex].text = text
        setHistory([...history])
        setDirty(true)
    }

    useEffect(() => {
        if (!upload) return
        const inlineData = {
            mimeType: upload.split(";")[0].split(":")[1],
            data: upload.split(",")[1]
        }
        parts.push({inlineData})
        setParts([...parts])
        setUpload(false)
    }, [upload])


    return (
        <Grid container spacing={2}>
            <Grid xs={12}><Typography variant="h6" hidden={history.length === 0}>Prompt history</Typography></Grid>
            {history.map((part, i) => <PromptHistoryItem item={part} itemIndex={i}
                                                         deleteHistoryPart={deleteHistoryPart}
                                                         handleHistoryPartTextChange={handleHistoryPartTextChange}
                                                         makeDirty={()=>setDirty(true)}
                                      />)}

            <Grid xs={12}><Typography variant="h6">Build your prompt</Typography></Grid>
            {parts.map((part, i) => <PromptBuilderPart part={part}
                                                       index={i}
                                                       deletePromptItem={deletePromptItem}
                                                       handleBuilderPartTextChange={handleBuilderPartTextChange}
                                    />)}

            <Grid xs={12} md={6}>
                <TextField label="Add some text to your prompt"
                           variant="outlined"
                           multiline
                           fullWidth
                           value={text}
                           onChange={e => setText(e.target.value)}
                           onKeyDown={submitText}
                           InputProps={{
                               endAdornment: (
                                   <InputAdornment position="end" onClick={submitText}>
                                       <AddCircle color={text.length > 0 ? "primary" : "text.disabled"}/>
                                   </InputAdornment>
                               ),
                           }}
                           helperText="At least one text item is required for each prompt you submit. Images are optional. <Shift>+Enter to make a new line."
                />
            </Grid>

            <Grid xs={12} md={6}>
                <Button component="label"
                        variant="outlined"
                        startIcon={<AddPhotoAlternate/>}
                        color="secondary"
                        size="large"
                        sx={{height: "56px", overflow: "hidden"}}
                        fullWidth
                >
                    Add an image to your prompt
                    <VisuallyHiddenInput type="file"
                                         accept="image/png,image/jpeg"
                                         onChange={handleUploadClick}
                    />
                </Button>
            </Grid>

            <Grid xs={12}>
                <Stack spacing={2} direction="row">

                    <Button onClick={onFormSubmit}
                            type="submit"
                            size="large"
                            variant="contained"
                            disabled={
                                (parts.length <= 0
                                    || loading
                                    || !parts.some(p => p.text !== undefined)
                                )
                                && !dirty
                            }
                            endIcon={loading ? <LoadingSpinner/> : <Textsms/>}
                            fullWidth
                            sx={{minHeight: "56px"}}
                    >
                        {dirty ? "Re-submit Prompt" : "Submit Prompt"}
                    </Button>

                    <Button onClick={clearAll}
                            size="large"
                            variant="outlined"
                            disabled={(parts.length <= 0 && history.length <= 0) || loading}
                            endIcon={<ClearAll/>}
                    >
                        Clear All
                    </Button>

                    <Button onClick={() => setShareDialogOpen(true)}
                            size="large"
                            variant="outlined"
                            endIcon={<IosShare/>}
                    >
                        Share / Import
                    </Button>
                    <ShareDialog open={shareDialogOpen}
                                 handleClose={() => setShareDialogOpen(false)}
                                 serialiseState={serialiseState}
                                 deserialiseState={deserialiseState}
                    />
                </Stack>
            </Grid>

            <Grid xs={12}>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ArrowDropDown/>}
                        aria-controls="panel1-content"
                        id="panel1-header"
                    >
                        <Typography>Safety settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack spacing={2}>
                            <TextField label="Sexually Explicit Threshold"
                                       select
                                       value={sexuallyExplicitThreshold}
                                       onChange={e => setSexuallyExplicitThreshold(e.target.value)}
                            >
                                {harmCategories()}
                            </TextField>
                            <TextField label="Hate Speech Threshold"
                                       select
                                       value={hateSpeechThreshold}
                                       onChange={e => setHateSpeechThreshold(e.target.value)}
                            >
                                {harmCategories()}
                            </TextField>
                            <TextField label="Harassment Threshold"
                                       select
                                       value={harassmentThreshold}
                                       onChange={e => setHarassmentThreshold(e.target.value)}
                            >
                                {harmCategories()}
                            </TextField>
                            <TextField label="Dangerous Content Threshold"
                                       select
                                       value={dangerousContentThreshold}
                                       onChange={e => setDangerousContentThreshold(e.target.value)}
                            >
                                {harmCategories()}
                            </TextField>
                        </Stack>
                    </AccordionDetails>
                </Accordion>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ArrowDropDown/>}
                        aria-controls="panel2-content"
                        id="panel2-header"
                    >
                        <Typography>Advanced settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Stack spacing={2}
                               direction="row"
                               sx={{mb: 1}}
                               alignItems="center">
                            <FormControl fullWidth>
                                <InputLabel id="temperature-slider">Temperature</InputLabel>
                                <Slider min={0}
                                        max={1}
                                        step={0.01}
                                        value={temperature}
                                        aria-labelledby="temperature-slider"
                                        valueLabelDisplay="auto"
                                        onChange={e => setTemperature(e.target.value)}
                                />
                            </FormControl>
                            <Tooltip title={<Typography>Lower temperatures are good for prompts that require a more
                                deterministic
                                and less open-ended or creative response, while higher temperatures can lead to more
                                diverse or creative results. A temperature of 0 will always return the same answer for
                                the same prompt.</Typography>}
                            >
                                <Info/>
                            </Tooltip>
                        </Stack>

                        <Stack spacing={2}
                               direction="row"
                               sx={{mb: 1}}
                               alignItems="center">
                            <FormControl fullWidth>
                                <InputLabel id="topk-slider">Top-K</InputLabel>
                                <Slider min={0}
                                        max={40}
                                        step={1}
                                        value={topK}
                                        aria-labelledby="topk-slider"
                                        valueLabelDisplay="auto"
                                        onChange={e => setTopK(e.target.value)}
                                />
                            </FormControl>
                            <Tooltip
                                title={<Typography>Specify a lower value for less random responses and a higher value
                                    for
                                    more random responses.</Typography>}
                            >
                                <Info/>
                            </Tooltip>
                        </Stack>

                        <Stack spacing={2}
                               direction="row"
                               sx={{mb: 1}}
                               alignItems="center">
                            <FormControl fullWidth>
                                <InputLabel id="topp-slider">Top-P</InputLabel>
                                <Slider min={0}
                                        max={1}
                                        step={0.01}
                                        value={topP}
                                        aria-labelledby="topp-slider"
                                        valueLabelDisplay="auto"
                                        onChange={e => setTopP(e.target.value)}
                                />
                            </FormControl>
                            <Tooltip
                                title={<Typography>Specify a lower value for less random responses and a higher value
                                    for
                                    more random responses.</Typography>}
                            >
                                <Info/>
                            </Tooltip>
                        </Stack>
                    </AccordionDetails>
                </Accordion>
            </Grid>

            <Grid xs={12}>
                {error.length > 0 && !loading &&
                    <Typography sx={{whiteSpace: 'pre-line', fontFamily: 'Monospace', color: 'error.main'}}>
                        {error}
                    </Typography>
                }
            </Grid>

        </Grid>
    )
}

export default Gemini
