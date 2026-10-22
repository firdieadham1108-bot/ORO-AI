import {useState} from "react";
import * as C from "../../components/ui/alert-dialog";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Alert Dialog" title="Alert Dialog" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.AlertDialog><C.AlertDialogTrigger asChild><Button variant="destructive">Review destructive action</Button></C.AlertDialogTrigger><C.AlertDialogContent><C.AlertDialogHeader><C.AlertDialogTitle>Continue with this demo action?</C.AlertDialogTitle><C.AlertDialogDescription>This only updates this preview, not your app.</C.AlertDialogDescription></C.AlertDialogHeader><C.AlertDialogFooter><C.AlertDialogCancel>Cancel</C.AlertDialogCancel><C.AlertDialogAction onClick={()=>setText("Confirmed in preview")}>Confirm</C.AlertDialogAction></C.AlertDialogFooter></C.AlertDialogContent></C.AlertDialog></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
