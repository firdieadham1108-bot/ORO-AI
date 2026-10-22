import {useState} from "react";
import * as C from "../../components/ui/switch";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Switch" title="Switch" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div className="space-y-6"><label className="flex gap-3 items-center"><C.Switch checked={checked} onCheckedChange={setChecked}/>Show approved jobs</label><label className="flex gap-3 items-center"><C.Switch disabled/>Disabled option</label></div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
