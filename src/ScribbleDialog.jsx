import {useState, useRef} from "react"
import {Dialog, Button, TextField, Stack, Tooltip, IconButton, Popover, useTheme} from "@mui/material"
import PropTypes from "prop-types"
import {Close, Edit} from "@mui/icons-material"
import {MaskEditor} from "./MaskEditor"
import {toMask} from "./ToMask"
import {BrushSize} from "./BrushSize"

function ScribbleDialog({open, handleClose, handleScribble, size={width: 1024, height: 1024}}) {
  const [scribblePrompt, setScribblePrompt] = useState("")
  const [scribbleNegativePrompt, setScribbleNegativePrompt] = useState("")
  const [error, setError] = useState("")
  const [brushSize, setBrushSize] = useState(10)
  const [promptAnchorEl, setPromptAnchorEl] = useState(null)

  const theme = useTheme()
  const canvas = useRef()

  const handleSubmit = () => {
    const mask = toMask(canvas.current)
    if (!mask.hasData) {
      setError("Please draw something first")
      return
    }
    if (!scribblePrompt) {
      setError("Please enter a prompt") 
      return
    }
    handleScribble({
      scribbleDataUrl: canvas.current.toDataURL(),
      scribblePrompt,
      scribbleNegativePrompt
    })
  }

  const dataUrl = makeBlankImage(size)

  const modalCloseFilter = (reason) => () => {
    if (reason && reason === "click" && toMask(canvas.current).hasData) return
    handleClose()
  }

  const handlePromptClick = (event) => {
    setPromptAnchorEl(event.currentTarget)
  }

  const handlePromptClose = () => {
    setPromptAnchorEl(null)
  }

  const promptOpen = Boolean(promptAnchorEl)
  const id = promptOpen ? 'prompt-popover' : undefined

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      fullScreen
      PaperProps={{sx: {backgroundColor: 'transparent'}}}
    >             
    <div className="bounds-outer">
      <div className="bounds-inner">
        <div className="a" onClick={(e) => e.stopPropagation()}>
            <MaskEditor
              src={dataUrl}
              cursorSize={brushSize}  
              canvasRef={canvas}
              cursorColor={theme.palette.primary.main}
            />

            <Stack direction="row" className="buttonTray" sx={{backgroundColor: "rgba(255, 255, 255, 0.5)"}}>
              <BrushSize brushSize={brushSize} setBrushSize={setBrushSize}/>
              <Tooltip title="Edit Prompts">
                <IconButton onClick={handlePromptClick} color="primary">
                  <Edit />
                </IconButton>
              </Tooltip>
            </Stack>

            <Popover
              id={id}
              open={promptOpen}
              anchorEl={promptAnchorEl}
              onClose={handlePromptClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <Stack spacing={2} sx={{p: 2, minWidth: 300}}>
                <TextField
                  label="Prompt"
                  fullWidth
                  value={scribblePrompt}
                  onChange={e => setScribblePrompt(e.target.value)}
                  error={error === "Please enter a prompt"}
                  helperText={error === "Please enter a prompt" ? error : undefined}
                />
                <TextField
                  label="Negative prompt (optional)"
                  fullWidth
                  value={scribbleNegativePrompt}
                  onChange={e => setScribbleNegativePrompt(e.target.value)}
                />
                <Button 
                  variant="contained" 
                  onClick={handleSubmit}
                  disabled={!scribblePrompt}
                >
                  Generate
                </Button>
              </Stack>
            </Popover>

            <Tooltip title="Close Image" placement="bottom-end">
              <IconButton size="large"
                          color="primary"
                          onClick={modalCloseFilter("close")}
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            zIndex: 100,
                          }}
              >
                <Close/>
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

const makeBlankImage = (size) => {
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, size.width, size.height)
  return canvas.toDataURL()
}

ScribbleDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleScribble: PropTypes.func.isRequired,
  size: PropTypes.object.isRequired,
}

export default ScribbleDialog 