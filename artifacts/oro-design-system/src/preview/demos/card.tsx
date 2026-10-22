import {useState} from "react";
import * as C from "../../components/ui/card";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Card" title="Card" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.Card className="max-w-md"><C.CardHeader><C.CardTitle>Quotation preview</C.CardTitle><C.CardDescription>Example content, no live customer data.</C.CardDescription></C.CardHeader><C.CardContent><p>6 × 1.5HP installation</p><strong>RM1,140.00</strong></C.CardContent><C.CardFooter><Button onClick={()=>setText("Preview confirmed")}>Confirm preview</Button></C.CardFooter></C.Card></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
