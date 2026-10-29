import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'AgentSketch — agents that get work done',description:'Build, save, and run AI agents in one focused workspace.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
