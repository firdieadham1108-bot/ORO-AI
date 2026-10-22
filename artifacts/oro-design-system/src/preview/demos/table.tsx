import {useState} from "react";
import * as C from "../../components/ui/table";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Table" title="Table" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.Table><C.TableCaption>Example quotation records, not live app data.</C.TableCaption><C.TableHeader><C.TableRow><C.TableHead>Reference</C.TableHead><C.TableHead>Status</C.TableHead><C.TableHead className="text-right">Total</C.TableHead></C.TableRow></C.TableHeader><C.TableBody><C.TableRow><C.TableCell className="font-mono">ORO-EXAMPLE</C.TableCell><C.TableCell>Pending</C.TableCell><C.TableCell className="text-right">RM1,140.00</C.TableCell></C.TableRow></C.TableBody><C.TableFooter><C.TableRow><C.TableCell colSpan={2}>Total</C.TableCell><C.TableCell className="text-right">RM1,140.00</C.TableCell></C.TableRow></C.TableFooter></C.Table></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
