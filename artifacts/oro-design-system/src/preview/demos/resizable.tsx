import {useState} from "react";
import * as C from "../../components/ui/resizable";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Resizable" title="Resizable" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.ResizablePanelGroup direction="horizontal" className="min-h-48 rounded-xl border"><C.ResizablePanel defaultSize={40}><div className="p-5">Enquiry</div></C.ResizablePanel><C.ResizableHandle withHandle/><C.ResizablePanel defaultSize={60}><div className="p-5">Quotation preview</div></C.ResizablePanel></C.ResizablePanelGroup></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
