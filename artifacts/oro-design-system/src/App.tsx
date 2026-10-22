import { DesignSystemBrowser } from './preview/DesignSystemBrowser';
import { ThemeProvider } from "next-themes";

function App() {
  return <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}><DesignSystemBrowser /></ThemeProvider>;
}

export default App;
