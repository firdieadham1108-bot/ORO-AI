import {useState} from "react";
import * as C from "../../components/ui/button-group";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Button Group" title="Button Group" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.ButtonGroup><Button variant="outline">Previous</Button><C.ButtonGroupSeparator/><C.ButtonGroupText>Week 1</C.ButtonGroupText><C.ButtonGroupSeparator/><Button variant="outline">Next</Button></C.ButtonGroup></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
