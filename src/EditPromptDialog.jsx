import {useState} from "react"
import {
  Autocomplete,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormLabel,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup
} from "@mui/material"
import classes from "./MaskClasses.js"
import PropTypes from "prop-types"

export const EditPromptDialog = ({open, baseImage, mask, handleClose, handleEdit}) => {
  const [editPrompt, setEditPrompt] = useState("")
  const [editNegativePrompt, setEditNegativePrompt] = useState("")
  const [editMode, setEditMode] = useState("inpainting-insert")
  const [maskType, setMaskType] = useState(mask && mask.hasData ? "painted" : "background")
  const [maskClasses, setMaskClasses] = useState([])

  const submitEditPrompt = () => {
    handleEdit({
      baseImage,
      editMode,
      maskType,
      maskClasses,
      editPrompt,
      editNegativePrompt,
      maskDataUrl: mask.hasData ? mask.dataUrl : undefined,
    })
    handleClose()
  }

  const handleKeyDown = (e) => {
    if (e.keyCode !== 13) return
    if (e.shiftKey) return
    submitEditPrompt()
  }

  return <Dialog open={open}
                 onClose={handleClose}
                 autoFocus
  >
    <DialogTitle>Edit Image</DialogTitle>
    <DialogContent>
      <Stack direction="column" spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormLabel>Mode</FormLabel>
          <ToggleButtonGroup
            value={editMode}
            aria-label="edit mode"
            exclusive
            color="primary"
            onChange={(e, v) => v !== null ? setEditMode(v) : undefined}
          >
            <ToggleButton
              value="inpainting-insert"
              aria-label="Insert"
            >Insert</ToggleButton>
            <ToggleButton
              value="inpainting-remove"
              aria-label="Remove"
            >Remove</ToggleButton>
            <ToggleButton
              value="outpainting"
              aria-label="Outpaint"
            >Outpaint</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormLabel>Where?</FormLabel>
          <ToggleButtonGroup
            value={maskType}
            aria-label="mask type"
            exclusive
            color="primary"
            onChange={(e, v) => v !== null ? setMaskType(v) : undefined}
          >
            {mask?.hasData &&
              <ToggleButton
                value="painted"
                aria-label="Painted Area"
              >Painted</ToggleButton>
            }
            <ToggleButton
              value="background"
              aria-label="Background"
            >Background</ToggleButton>
            {editMode !== "outpainting" &&
                <ToggleButton
                value="foreground"
                aria-label="Foreground"
              >Foreground</ToggleButton>
            }
            {editMode !== "outpainting" &&
              <ToggleButton
                value="semantic"
                aria-label="Semantic"
              >Semantic</ToggleButton>
            }
          </ToggleButtonGroup>
        </Stack>
        {editMode === "inpainting-insert" &&
          <TextField label="Enter your prompt here"
                     variant="outlined"
                     fullWidth
                     autoFocus
                     multiline={true}
                     value={editPrompt}
                     error={editPrompt.length === 0}
                     onChange={e => setEditPrompt(e.target.value)}
                     helperText={editPrompt.length === 0 ? "Required" : undefined}
                     onKeyDown={handleKeyDown}
          />
        }
        {maskType === "semantic" &&
          <Stack direction="row" spacing={2} alignItems="center">
            <Autocomplete
              multiple
              fullWidth
              id="maskClasses-select"
              options={classes}
              getOptionLabel={c => c.name}
              filterSelectedOptions
              onChange={(e, v) => setMaskClasses(v)}
              value={maskClasses}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Mask classes"
                  placeholder="Mask classes"
                  helperText={maskClasses.length <= 0 || maskClasses.length > 5 ? "Select up to 5 classes" : undefined}
                  error={maskClasses.length <= 0 || maskClasses.length > 5}
                />
              )}
            />
          </Stack>
        }
        <TextField label="Negative prompt (optional)"
                   variant="outlined"
                   fullWidth
                   value={editNegativePrompt}
                   onChange={e => setEditNegativePrompt(e.target.value)}
                   onKeyDown={handleKeyDown}
        />
        <Button variant="contained"
                fullWidth
                onClick={() => submitEditPrompt()}
                disabled={(maskType === "inpaint-insert" && editPrompt.length <= 0) ||
                  (maskType === "semantic" && (maskClasses.length <= 0 || maskClasses.length > 5))}
        >
          Submit Prompt
        </Button>
      </Stack>
    </DialogContent>
  </Dialog>
}
EditPromptDialog.propTypes = {
  open: PropTypes.bool,
  mask: PropTypes.object,
  baseImage: PropTypes.object,
  handleClose: PropTypes.func,
  handleEdit: PropTypes.func,
}
