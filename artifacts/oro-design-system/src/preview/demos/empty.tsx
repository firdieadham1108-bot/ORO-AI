import {useState} from "react";
import * as C from "../../components/ui/empty";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Empty" title="Empty" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.Empty><C.EmptyHeader><C.EmptyMedia variant="icon"><Inbox/></C.EmptyMedia><C.EmptyTitle>No drafts yet</C.EmptyTitle><C.EmptyDescription>This is the generic UI empty primitive, separate from the app's compact Empty state.</C.EmptyDescription></C.EmptyHeader><C.EmptyContent><Button onClick={()=>setText("Example action selected")}>New preview</Button></C.EmptyContent></C.Empty></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
