import {useState} from "react";
import * as C from "../../components/ui/dialog";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Dialog" title="Dialog" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.Dialog><C.DialogTrigger asChild><Button>Open dialog</Button></C.DialogTrigger><C.DialogContent><C.DialogHeader><C.DialogTitle>Quotation details</C.DialogTitle><C.DialogDescription>Preview content only.</C.DialogDescription></C.DialogHeader><Input aria-label="Customer" placeholder="Customer name"/><C.DialogFooter><C.DialogClose asChild><Button variant="outline">Close</Button></C.DialogClose></C.DialogFooter></C.DialogContent></C.Dialog></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
