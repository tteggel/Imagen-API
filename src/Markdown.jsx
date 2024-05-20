import {default as ReactMarkdown} from "react-markdown"
import {
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material"
import remarkGfm from "remark-gfm"
import {default as SyntaxHighlighter} from "react-syntax-highlighter"
import {
  tomorrow as lightHighlightStyle,
  tomorrowNight as darkHighlightStyle,
} from "react-syntax-highlighter/dist/cjs/styles/hljs"
import GlobalStyles from "@mui/material/GlobalStyles"
import PropTypes from "prop-types"

export default function Markdown({markdown}) {

  const theme = useTheme()

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // *********
        // * Links *
        // *********
        a: ({href, children}) => (<Link href={href} underline={"always"}>{children}</Link>),

        // ********
        // * Text *
        // ********
        p: ({children}) => (<Typography sx={{mt: 0}}>{children}</Typography>),
        del: ({children}) => (<Typography sx={{mt: 1, textDecoration: "line-through"}}>{children}</Typography>),
        em: ({children}) => (<Typography sx={{mt: 1, fontStyle: "italic"}}>{children}</Typography>),
        strong: ({children}) => (<Typography sx={{mt: 1, fontWeight: "bold"}}>{children}</Typography>),
        b: ({children}) => (<Typography sx={{mt: 1, fontWeight: "bold"}}>{children}</Typography>),
        h1: ({children}) => (<Typography gutterBottom sx={{mt: 2}} variant={"h1"}>{children}</Typography>),
        h2: ({children}) => (<Typography gutterBottom sx={{mt: 2}} variant={"h2"}>{children}</Typography>),
        h3: ({children}) => (<Typography gutterBottom sx={{mt: 2}} variant={"h3"}>{children}</Typography>),
        h4: ({children}) => (<Typography gutterBottom sx={{mt: 2}} variant={"h4"}>{children}</Typography>),
        h5: ({children}) => (<Typography gutterBottom sx={{mt: 2}} variant={"h5"}>{children}</Typography>),
        h6: ({children}) => (<Typography gutterBottom sx={{mt: 2}} variant={"h6"}>{children}</Typography>),

        // **********
        // * Tables *
        // **********
        table: ({children}) => (<TableContainer component={Paper} sx={{mt: 2}}>
          <Table size="small">{children}</Table>
        </TableContainer>),
        tbody: ({children}) => (<TableBody>{children}</TableBody>),
        // th: ({ children }) => (<TableHead>{children}</TableHead>),
        tr: ({children}) => (<TableRow>{children}</TableRow>),
        td: ({children}) => (<TableCell><Typography>{children}</Typography></TableCell>),

        // *********
        // * Lists *
        // *********
        ol: ({children}) => (<List sx={{
          listStyleType: "decimal",
          mt: 2,
          pl: 2,
          "& .MuiListItem-root": {
            display: "list-item",
          },
        }}>{children}</List>),
        ul: ({children}) => (<List sx={{
          listStyleType: "disc",
          mt: 2,
          pl: 2,
          "& .MuiListItem-root": {
            display: "list-item",
          },
        }}>{children}</List>),
        li: ({children}) => (
          <ListItem sx={{m: 0, p: 0, ml: 2}} disableGutters><ListItemText
            sx={{pl: 0.25}}>{children}</ListItemText></ListItem>),

        // ********
        // * Code *
        // ********
        code: ({className, children}) => {
          const match = /language-(\w+)/.exec(className || "")
          return (
            <>
              <GlobalStyles styles={{code: {color: "inherit", background: "transparent"}}}/>
              <SyntaxHighlighter
                style={theme.palette.mode === "light" ? lightHighlightStyle : darkHighlightStyle}
                language={match ? match[1] : undefined}
                PreTag="div"

              >
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            </>
          )
        },
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}

Markdown.propTypes = {
  markdown: PropTypes.string
}
