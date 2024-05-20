import "./App.css"
import {Box, Container, Tab, Tabs} from "@mui/material"
import Imagen2 from "./Imagen2.jsx"
import Gemini from "./Gemini.jsx"
import {BrowserRouter, Route, Routes, useLocation, Link, Navigate} from "react-router-dom"
import PropTypes from "prop-types"

function Router(props) {
  const { children } = props
  return (
    <BrowserRouter initialEntries={['/imagen2']} initialIndex={0} basename="/ai">
      {children}
    </BrowserRouter>
  )
}
Router.propTypes = {
  children: PropTypes.object,
}

function TheTabs() {
  const { pathname } = useLocation()
  const currentTab = ["imagen2", "/gemini"].includes(pathname) ? pathname : "/imagen2"
  return (
    <Tabs value={currentTab}>
      <Tab label="Images" value="/imagen2" to="/imagen2" component={Link}/>
      <Tab label="Text" value="/gemini" to="/gemini" component={Link}/>
    </Tabs>
  )
}

function App() {
  return (
    <Router>
      <Container maxWidth="xl">
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TheTabs/>
        </Box>
        <Box mt={2}>
          <Routes>
            <Route path="/imagen2" element={<Imagen2/>}/>
            <Route path="/gemini/*" element={<Gemini/>}/>
            <Route path="*" element={<Navigate to="/imagen2"/>}/>
          </Routes>
        </Box>
      </Container>
    </Router>
  )
}

export default App
