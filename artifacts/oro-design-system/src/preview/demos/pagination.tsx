import {useState} from "react";
import * as C from "../../components/ui/pagination";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Pagination" title="Pagination" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.Pagination><C.PaginationContent><C.PaginationItem><C.PaginationPrevious href="#" onClick={e=>{e.preventDefault();setCount(n=>Math.max(1,n-1))}}/></C.PaginationItem>{[1,2,3].map(n=><C.PaginationItem key={n}><C.PaginationLink href="#" isActive={count===n} onClick={e=>{e.preventDefault();setCount(n)}}>{n}</C.PaginationLink></C.PaginationItem>)}<C.PaginationItem><C.PaginationEllipsis/></C.PaginationItem><C.PaginationItem><C.PaginationNext href="#" onClick={e=>{e.preventDefault();setCount(n=>n+1)}}/></C.PaginationItem></C.PaginationContent></C.Pagination></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
