import {useState} from "react";
import * as C from "../../components/ui/separator";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Separator" title="Separator" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div><p>Quotation details</p><C.Separator className="my-5"/><div className="flex gap-4 h-6"><span>Price</span><C.Separator orientation="vertical"/><span>Crew</span><C.Separator orientation="vertical"/><span>Appointment</span></div></div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
