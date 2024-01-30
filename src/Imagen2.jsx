import React, { useState } from "react"
import "./App.css"
import {
    Button,
    FormControl,
    InputLabel, List, ListItemText,
    MenuItem,
    Select,
    Slider,
    Stack,
    TextField,
    Tooltip, Typography
} from "@mui/material"
import Grid from "@mui/material/Unstable_Grid2"
import LoadingSpinner from "./LoadingSpinner"
import {Info} from "@mui/icons-material";

function Imagen2() {
    const [preview, setPreview] = useState("")
    const [loading, setLoading] = useState(false)
    const [prompt, setPrompt] = useState("")
    const [negativePrompt, setNegativePrompt] = useState("")
    const [guidanceScale, setGuidanceScale] = useState(10)
    const [language, setLanguage] = useState("auto")
    const [error, setError] = useState("")

    const generateImages = async () => {
        if(prompt === "") return
        try {
            //const instance = { prompt, image: preview ? {bytesBase64Encoded: preview.split(",")[1]} : undefined }
            const np = negativePrompt.length > 0 ? negativePrompt : undefined
            const body = {
                instances: [{prompt}],
                parameters: {negativePrompt: np, guidanceScale, language, sampleCount: 2}
            }
            const res = await fetch("/api/generate-image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body)
            })
            if (!res.ok) throw new Error(await res.text())
            setPreview(`data:image/png;base64,${await res.text()}`)
            setLoading(false)
        }
        catch(err){
            setError(err.message)
            setPreview("")
            setLoading(false)
        }
    }

    const onFormSubmit = (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        return generateImages()
    }

    const previewImage = (e) => {
        const reader = new FileReader()

        reader.addEventListener("load", () => setPreview(reader.result), false)

        if (e?.target?.files?.[0]) {
            reader.readAsDataURL(e.target.files[0])
        }
    }

    const guidanceTooltip = () => {
        return (
            <React.Fragment>
                <Typography variant="h6">How strong do you want the prompt(s) to be?</Typography>
                <Typography>
                    A larger number will make an image that is closer to your prompt(s),
                    a smaller number will result in a more creative image.
                </Typography>
                <Typography variant="h6">Suggested values</Typography>
                <List>
                    <ListItemText>0-9: low strength</ListItemText>
                    <ListItemText>10-20: medium strength</ListItemText>
                    <ListItemText>21 or higher: high strength</ListItemText>
                </List>
            </React.Fragment>
        )
    }

    const guidanceScaleColor = (g) => {
        if (g <= 9) return "success"
        else if (g <= 20 ) return "warning"
        else return "error"
    }

    const guidanceScaleSuffix = (g) => {
        if (g <= 9) return `${g} (low)`
        else if (g <= 20 ) return `${g} (medium)`
        else return `${g} (high)`
    }

    return (
        <form>
        <Grid container spacing={2}>
            <Grid xs={10}>
                <TextField label="Enter your prompt here" variant="outlined" fullWidth  value={prompt}
                           onChange={e => setPrompt(e.target.value)}
                           error={prompt.length === 0} helperText={prompt.length === 0 ? "Required" : undefined}/>
            </Grid>

            <Grid xs={2}>
                <TextField labelId="language-label" value={language} label="Language" select
                        onChange={e => setLanguage(e.target.value)} fullWidth>
                    <MenuItem value="auto">(auto)</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="hi">Hindi</MenuItem>
                    <MenuItem value="ja">Japanese</MenuItem>
                    <MenuItem value="ko">Korean</MenuItem>
                </TextField>
            </Grid>

            <Grid xs={10}>
                <TextField label="Negative prompt (optional)" variant="outlined" fullWidth  value={negativePrompt}
                           onChange={e => setNegativePrompt(e.target.value)}/>
            </Grid>

            <Grid xs={12}>
                <Stack spacing={2} direction="row" sx={{ mb: 1 }} alignItems="center">
                    <FormControl fullWidth>
                        <InputLabel id="strength-slider">Prompt strength</InputLabel>
                        <Slider min={0} max={50} defaultValue={10} value={guidanceScale}
                                aria-labelledby="strength-slider" valueLabelDisplay="auto" label="Prompt strength"
                                onChange={e => setGuidanceScale(e.target.value)}
                                color={guidanceScaleColor(guidanceScale)}
                                getAriaValueText={guidanceScaleSuffix} valueLabelFormat={guidanceScaleSuffix}/>
                    </FormControl>
                     <Tooltip title={guidanceTooltip()}><Info/></Tooltip>
                </Stack>
            </Grid>

            <Grid xs={2}>
                {!loading && <Button onClick={onFormSubmit} type="submit"
                                     size="large" variant="contained"
                                     disabled={prompt.length <= 0} >Generate Image</Button>}
                {loading && <LoadingSpinner/>}
            </Grid>

            <Grid xs={12}>
                {preview.length > 0 && !loading && <img id="baseImage" src={preview} style={{ maxWidth: "100%" }}/>}
            </Grid>


            <Grid xs={12}>
                {error.length > 0 && !loading && <Typography>{error}</Typography>}
            </Grid>
        </Grid>
        </form>
    )
}

export default Imagen2
