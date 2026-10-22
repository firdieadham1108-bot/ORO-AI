import {useState} from "react";
import * as C from "../../components/ui/radio-group";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Radio Group" title="Radio Group" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.RadioGroup value={selected} onValueChange={setSelected}>{[["a","All quotes"],["b","Pending"],["c","Disabled"]].map(([v,label])=><label key={v} className="flex gap-3 items-center"><C.RadioGroupItem value={v} disabled={v==="c"}/>{label}</label>)}</C.RadioGroup></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
