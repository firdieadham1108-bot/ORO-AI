import {useState} from "react";
import * as C from "../../components/ui/input-group";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Input Group" title="Input Group" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div className="space-y-4 max-w-lg"><C.InputGroup><C.InputGroupAddon><C.InputGroupText>RM</C.InputGroupText></C.InputGroupAddon><C.InputGroupInput placeholder="Amount" aria-label="Amount"/><C.InputGroupAddon align="inline-end"><C.InputGroupButton onClick={()=>setText("Amount checked")}>Check</C.InputGroupButton></C.InputGroupAddon></C.InputGroup><C.InputGroup><C.InputGroupTextarea aria-label="Customer enquiry" placeholder="Customer enquiry"/><C.InputGroupAddon align="block-end"><C.InputGroupText>Editable message</C.InputGroupText></C.InputGroupAddon></C.InputGroup></div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
