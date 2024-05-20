import React, {useState} from "react"
import {Dialog, IconButton, Popover, Slider, Stack, Tooltip, Typography, useTheme} from "@mui/material"
import {useDebounce} from "react-use"
import {Brush, Close, Edit, LineWeight} from "@mui/icons-material"
import {toMask} from "./ToMask.js"
import {MaskEditor} from "./MaskEditor.jsx"
import PropTypes from "prop-types"
import {EditPromptDialog} from "./EditPromptDialog.jsx"

export const ImageEditDialog = ({prediction, handleClose, handleEdit}) => {
  const [hasMask, setHasMask] = useState(false)
  const [brushSizeOpen, setBrushSizeOpen] = useState(false)
  const [brushSize, setBrushSize] = useState(50)
  const [editPromptDialogOpen, setEditPromptDialogOpen] = useState(false)
  const [mask, setMask] = useState(null)

  const theme = useTheme()

  const canvas = React.useRef()

  useDebounce(() => {
    setBrushSizeOpen(false)
  }, 1500, [brushSize])

  if (!prediction) return
  if (prediction.mimeType === undefined || prediction.bytesBase64Encoded === undefined) return

  const dataUrl = `data:${prediction.mimeType};base64,${prediction.bytesBase64Encoded}`

  const EditToolTray = <Stack direction="row"
                              className="buttonTray"
                              sx={{backgroundColor: "rgba(255, 255, 255, 0.5)"}}
                              p={1}
  >
    <Tooltip title={!hasMask ? "Open Image Editing Tools" : "Close Image Editing Tools"} placement="bottom-end">
      <IconButton size="large"
                  color={hasMask ? "primary" : "default"}
                  onClick={() => setHasMask(!hasMask)}
      >
        {hasMask ? <Close/> : <Brush/>}
      </IconButton>
    </Tooltip>
    {hasMask && <>
      <Stack direction="column" spacing={0} maxHeight={300}>
        <Tooltip title="Brush Size" placement="bottom-end">
          <IconButton size="large"
                      color={brushSizeOpen ? "primary" : "default"}
                      onClick={(e) => setBrushSizeOpen(brushSizeOpen ? undefined : e.currentTarget)}
          >
            <LineWeight/>
          </IconButton>
        </Tooltip>
        <Popover open={Boolean(brushSizeOpen)}
                 onClose={() => setBrushSizeOpen(undefined)}
                 anchorEl={brushSizeOpen}
                 anchorOrigin={{
                   vertical: "bottom",
                   horizontal: "left",
                 }}
        >
          <Stack height={300} width={48} my={3} spacing={3} alignItems="center">
            <Typography>{brushSize}</Typography>
            <Slider orientation="vertical"
                    defaultValue={30}
                    min={5}
                    max={250}
                    value={brushSize}
                    aria-label="Brush Size (px)"
                    onChange={(e) => setBrushSize(e.target.value)}
            />
          </Stack>
        </Popover>
      </Stack>
      <Tooltip title="Edit image with prompt" placement="bottom-end">
        <IconButton size="large"
                    color="primary"
                    onClick={() => {
                      setMask(toMask(canvas.current));
                      setEditPromptDialogOpen(true)
                    }}
                    sx={{
                      backgroundColor: "primary.main",
                      color: "white",
                      "&:hover": "primary.main",
                    }}
        >
          <Edit/>
        </IconButton>
      </Tooltip>
    </>}
  </Stack>

  const modalCloseFilter = (reason) => () => {
    if (reason && reason === "click" && hasMask) return
    handleClose()
  }

  return (<Dialog open={Boolean(prediction)}
                  fullScreen
                  onClick={modalCloseFilter("click")}
                  PaperProps={{sx: {backgroundColor: 'transparent'}}}
  >
    <div className="bounds-outer">
      <div className="bounds-inner">
        <div className="a" onClick={(e) => e.stopPropagation()}>
          {!hasMask && <img src={dataUrl} className="imageOpen" alt="Imagen2"/>}
          {hasMask && <MaskEditor src={dataUrl}
                                  cursorSize={brushSize}
                                  canvasRef={canvas}
                                  cursorColor={theme.palette.primary.main}
          />
          }
          <Stack direction="row" className="buttonTray" sx={{backgroundColor: "rgba(255, 255, 255, 0.5)"}}>
            {EditToolTray}
            <EditPromptDialog open={editPromptDialogOpen} handleClose={() => setEditPromptDialogOpen(false)}
                              baseImage={prediction} mask={mask} handleEdit={handleEdit}/>
          </Stack>
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
  </Dialog>)
}
ImageEditDialog.propTypes = {
  prediction: PropTypes.object,
  handleClose: PropTypes.func,
  handleEdit: PropTypes.func,
}