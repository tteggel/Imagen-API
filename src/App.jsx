import "./App.css"
import {Container, Typography} from "@mui/material"
import Imagen2 from "./Imagen2.jsx";
import Gemini from "./Gemini.jsx";

function App() {

    return (
        <Container maxwidth="l">
        <Typography variant="h1">Generative AI Sandbox</Typography>

          <Imagen2/>

        </Container>
    )
}

export default App
