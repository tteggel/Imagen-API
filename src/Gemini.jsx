import {
    Button,
    InputAdornment,
    styled,
    TextField,
    Typography
} from "@mui/material"
import LoadingSpinner from "./LoadingSpinner.jsx"
import React, {useEffect, useState} from "react"
import Grid from "@mui/material/Unstable_Grid2"
import {Textsms, AddCircle, DeleteForever} from "@mui/icons-material"
import Markdown from "./Markdown.jsx"
import {AddPhotoAlternate, ClearAll} from "@mui/icons-material/"

function Gemini() {
    const [loading, setLoading] = useState(false)
    const [history, setHistory] = useState([])
    const [parts, setParts] = useState([])
    const [text, setText] = useState("")
    const [error, setError] = useState("")
    const [upload, setUpload] = useState(false)

    const generateText = async () => {
        if(parts.length === 0) return
        const rq = {
            contents: history
        }
        try {
            const rs = await fetch("/api/generate-text", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(rq)
            })
            if (!rs.ok) {
                throw new Error(await rs.text())
            }
            setLoading(false)

            const body = await rs.json()

            history.push(body)
            setHistory([...history])
        }
        catch(err){
            setError(err.message)
            setLoading(false)
        }
    }

    const onFormSubmit = async (e) => {
        e.preventDefault()
        if(text.length > 0) await submitText()
        history.push({role:"USER", parts})
        setHistory([...history])
        setText("")
        setLoading(true)
        setError("")
        const partsRq = parts
        setParts([])
        return generateText(partsRq)
    }

    const deletePromptItem = (historyIndex, index) => () => {
        const p = historyIndex !== null ? history[index].parts : parts
        p.splice(index, 1)
        if (historyIndex !== null && p.length === 0) history.splice(historyIndex, 1)
        if (historyIndex !== null) setHistory([...history])
        else setParts([...parts])
    }

    const formatHistoryItem = (item, index) => {
        return item.parts.map(formatPromptItem(index, true, item.role))
    }

    const formatPromptItem = (historyIndex, del, role) => (item, index) => {
        return (<>
            <Grid xs={1}>
                {role && index === 0 && <Typography variant="subtitle2">{role.toUpperCase()}</Typography>}
            </Grid>
            <Grid xs={10}>
                {item.text && <Markdown markdown={item.text}/>}
                {item.inlineData && <img src={`data:${item.inlineData.mimeType};base64,${item.inlineData.data}`}
                                         style={{maxWidth: "100px", maxHeight: "100px"}}
                                    />
                }
            </Grid>
                <Grid xs={1}>
                    {del && <DeleteForever onClick={deletePromptItem(historyIndex, index)}/>}
                </Grid>
            </>
        )
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

    return (
    <Grid container spacing={2}>
        <Grid xs={12}><Typography variant="h2">Text Generation</Typography></Grid>

        <Grid xs={12}><Typography variant="h3" hidden={history.length === 0}>Prompt history</Typography></Grid>
        { history.map(formatHistoryItem) }

        <Grid xs={12}><Typography variant="h3">Build your prompt</Typography></Grid>
        { parts.map(formatPromptItem(null, true)) }

        <Grid xs={6}>
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
                                   <AddCircle color={text.length > 0 ? "primary" : "text.disabled"} />
                               </InputAdornment>
                           ),
                       }}
            />
        </Grid>

        <Grid xs={6}>
            <Button component="label"
                    variant="outlined"
                    startIcon={<AddPhotoAlternate />}
                    color="secondary"
                    size="large"
                    sx={{height:"56px"}}
                    fullWidth
            >
                Add an image to your prompt
                <VisuallyHiddenInput type="file"
                                     accept="image/png,image/jpeg"
                                     onChange={handleUploadClick}
                />
            </Button>
        </Grid>

        <Grid xs={3}>
            <Button onClick={onFormSubmit}
                    type="submit"
                    size="large"
                    variant="contained"
                    disabled={parts.length <= 0 || loading}
                    endIcon={loading?<LoadingSpinner/>:<Textsms/>}
            >
                Submit Prompt
            </Button>
        </Grid>

        <Grid xs={3}>
            <Button onClick={()=>{setParts([]); setHistory([])}}
                    size="large"
                    variant="outlined"
                    disabled={parts.length <= 0 || loading}
                    endIcon={<ClearAll/>}
            >
                Clear All
            </Button>
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
