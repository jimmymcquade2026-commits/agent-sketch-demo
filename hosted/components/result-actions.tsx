'use client';
import {useState} from 'react';
export function ResultActions({text,onDownload}:{text:string;onDownload:()=>void}){
 const [message,setMessage]=useState('');
 return <div className="resultactions"><button className="secondary" onClick={async()=>{try{await navigator.clipboard.writeText(text);setMessage('Copied.')}catch{setMessage('Copy unavailable. Select the result text or download it.')}}}>Copy result</button><button className="secondary" onClick={onDownload}>Download ↓</button><span role="status" className="small">{message}</span></div>
}
