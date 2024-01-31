import React, {useEffect, useState} from "react"
import "./App.css"
import {
    Box,
    Button,
    Dialog,
    FormControl,
    ImageList,
    ImageListItem,
    InputLabel,
    List,
    ListItemText,
    MenuItem,
    Slider,
    Stack,
    TextField,
    Tooltip,
    Typography
} from "@mui/material"
import Grid from "@mui/material/Unstable_Grid2"
import LoadingSpinner from "./LoadingSpinner"
import {Info, Brush} from "@mui/icons-material"

function Imagen2() {
    const [preview, setPreview] = useState([])
    const [loading, setLoading] = useState(false)
    const [prompt, setPrompt] = useState("")
    const [negativePrompt, setNegativePrompt] = useState("")
    const [guidanceScale, setGuidanceScale] = useState(10)
    const [language, setLanguage] = useState("auto")
    const [error, setError] = useState("")
    const [imageOpen, setImageOpen] = useState("")

    const generateImages = async () => {
        if(prompt === "") return
        try {
            //const instance = { prompt, image: preview ? {bytesBase64Encoded: preview.split(",")[1]} : undefined }
            const np = negativePrompt.length > 0 ? negativePrompt : undefined
            const body = {
                instances: [{prompt}],
                parameters: {negativePrompt: np, guidanceScale, language, sampleCount: 4}
            }
            const res = await fetch("/api/generate-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })
            if (!res.ok) throw new Error(await res.text())
            const images = (await res.json()).map(prediction => `data:image/png;base64,${prediction.bytesBase64Encoded}`)
            setPreview(images)
            setLoading(false)
        }
        catch(err){
            setError(err.message)
            setPreview([])
            setLoading(false)
        }
    }

    const onFormSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        return generateImages()
    }

    const guidanceTooltip = () => {
        return (
            <>
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
            </>
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
            <Grid xs={12} md={10}>
                <TextField label="Enter your prompt here"
                           variant="outlined"
                           fullWidth
                           value={prompt}
                           error={prompt.length === 0}
                           onChange={e => setPrompt(e.target.value)}
                           helperText={prompt.length === 0 ? "Required" : undefined}
                />
            </Grid>

            <Grid xs={12} md={2}>
                <TextField label="Language"
                           select
                           fullWidth
                           value={language}
                           onChange={e => setLanguage(e.target.value)}
                >
                    <MenuItem value="auto">(auto)</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="hi">Hindi</MenuItem>
                    <MenuItem value="ja">Japanese</MenuItem>
                    <MenuItem value="ko">Korean</MenuItem>
                </TextField>
            </Grid>

            <Grid xs={12} md={10}>
                <TextField label="Negative prompt (optional)"
                           variant="outlined"
                           fullWidth
                           value={negativePrompt}
                           onChange={e => setNegativePrompt(e.target.value)}
                />
            </Grid>

            <Grid xs={12}>
                <Stack spacing={2}
                       direction="row"
                       sx={{ mb: 1 }}
                       alignItems="center">
                    <FormControl fullWidth>
                        <InputLabel id="strength-slider">Prompt strength</InputLabel>
                        <Slider min={0}
                                max={50}
                                value={guidanceScale}
                                aria-labelledby="strength-slider"
                                valueLabelDisplay="auto"
                                onChange={e => setGuidanceScale(e.target.value)}
                                color={guidanceScaleColor(guidanceScale)}
                                getAriaValueText={guidanceScaleSuffix}
                                valueLabelFormat={guidanceScaleSuffix}
                        />
                    </FormControl>
                     <Tooltip title={guidanceTooltip()}><Info/></Tooltip>
                </Stack>
            </Grid>

            <Grid xs={12} md={4}>
                <Button onClick={onFormSubmit}
                        type="submit"
                        size="large"
                        variant="contained"
                        disabled={prompt.length <= 0 || loading}
                        endIcon={loading?<LoadingSpinner/>:<Brush/>}
                        fullWidth
                >
                    Generate Images
                </Button>
            </Grid>

            <Grid xs={12}>
                { preview.length > 0 && !loading &&
                    <ImageList cols={2}>
                        { preview.map(image =>
                            <ImageListItem>
                                <img src={image}
                                     style={{maxWidth: "100%"}}
                                     onClick={e=>setImageOpen(image)}
                                />
                            </ImageListItem>
                        )}
                    </ImageList>
                }
                <Dialog open={Boolean(imageOpen)}
                        fullScreen
                        onClick={()=>setImageOpen("")}
                        PaperProps={{sx: { backgroundColor: 'transparent'}}}
                >
                    <Box display="flex"
                         justifyContent="center"
                         alignItems="center"
                         minHeight="100vh"
                         sx={{background: "rgba(0, 0, 0, 0.75)"}}
                    >
                        <img src={imageOpen} style={{maxWidth: "1024px"}}/>
                    </Box>
                </Dialog>
            </Grid>


            <Grid xs={12}>
                {error.length > 0 && !loading &&
                    <Typography sx={{whiteSpace: 'pre-line', fontFamily: 'Monospace', color: 'error.main'}}>
                        {error}
                    </Typography>}
            </Grid>
        </Grid>
        </form>
    )
}

export default Imagen2
