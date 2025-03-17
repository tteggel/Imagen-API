import {IconButton, Popover, Stack, Tooltip, Typography, Slider} from "@mui/material"
import {useState} from "react"
import {LineWeight} from "@mui/icons-material"
import PropTypes from "prop-types"
import {useDebounce} from "react-use"

export const BrushSize = ({brushSize, setBrushSize}) => {
    const [brushSizeOpen, setBrushSizeOpen] = useState(false)

    useDebounce(() => {
        setBrushSizeOpen(false)
      }, 1500, [brushSize])

    return (
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
    )
}

BrushSize.propTypes = {
    setBrushSize: PropTypes.func.isRequired,
    brushSize: PropTypes.number.isRequired,
}
    