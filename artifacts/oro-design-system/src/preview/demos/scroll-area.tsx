import {useState} from "react";
import * as C from "../../components/ui/scroll-area";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Scroll Area" title="Scroll Area" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.ScrollArea className="h-48 rounded-xl border p-4"><div className="min-w-[640px]">{Array.from({length:20},(_,i)=><p className="py-2 border-b" key={i}>Example activity row {i+1}</p>)}</div><C.ScrollBar orientation="horizontal"/></C.ScrollArea></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
