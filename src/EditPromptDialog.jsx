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
  const [editMode, setEditMode] = useState("EDIT_MODE_DEFAULT")
  const [maskType, setMaskType] = useState(mask && mask.hasData ? "MASK_MODE_USER_PROVIDED" : "MASK_MODE_BACKGROUND")
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
                 maxWidth="md"                
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
              value="EDIT_MODE_DEFAULT"
              aria-label="Default"
            >Default</ToggleButton>
            <ToggleButton
              value="EDIT_MODE_INPAINT_INSERTION"
              aria-label="Insert"
            >Replace</ToggleButton>
            <ToggleButton
              value="EDIT_MODE_INPAINT_REMOVAL"
              aria-label="Remove"
            >Remove</ToggleButton>
            <ToggleButton
              value="EDIT_MODE_BGSWAP"
              aria-label="Background Swap"
            >Background Swap</ToggleButton>
            <ToggleButton
              value="EDIT_MODE_OUTPAINT"
              aria-label="Outpaint"
            >Outpaint</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        {(editMode === "EDIT_MODE_INPAINT_INSERTION" || editMode === "EDIT_MODE_INPAINT_REMOVAL") &&
        <Stack direction="row" spacing={2} alignItems="center">
          <FormLabel>What?</FormLabel>
          <ToggleButtonGroup
            value={maskType}
            aria-label="mask type"
            exclusive
            color="primary"
            onChange={(e, v) => v !== null ? setMaskType(v) : undefined}
          >
            {mask?.hasData &&
              <ToggleButton
                value="MASK_MODE_USER_PROVIDED"
                aria-label="Painted Area"
              >Painted</ToggleButton>
            }
            <ToggleButton
              value="MASK_MODE_BACKGROUND"
              aria-label="Background"
            >Background</ToggleButton>
            <ToggleButton
              value="MASK_MODE_FOREGROUND"
              aria-label="Foreground"
            >Foreground</ToggleButton>
            <ToggleButton
              value="MASK_MODE_SEMANTIC"
              aria-label="Semantic"
            >Semantic</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        }
        {(editMode === "EDIT_MODE_INPAINT_INSERTION" || editMode === "EDIT_MODE_DEFAULT" || editMode === "EDIT_MODE_BGSWAP") &&
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
        {maskType === "MASK_MODE_SEMANTIC" &&
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
