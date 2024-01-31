import "./App.css"
import {Box, Container, Tab, Typography} from "@mui/material"
import Imagen2 from "./Imagen2.jsx";
import Gemini from "./Gemini.jsx";
import {useState} from "react";
import {TabContext, TabList, TabPanel} from "@mui/lab";

function App() {
    const [tabPage, setTabPage] = useState("2")
    return (
        <Container maxwidth="l">
        <Typography variant="h1">Generative AI Sandbox</Typography>

        <TabContext value={tabPage}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList onChange={(e,v)=>setTabPage(v)}>
                    <Tab label="Images" value="1" />
                    <Tab label="Text" value="2" />
                </TabList>
            </Box>
            <TabPanel value="1"><Imagen2/></TabPanel>
            <TabPanel value="2"><Gemini/></TabPanel>
        </TabContext>

        </Container>
    )
}

export default App
