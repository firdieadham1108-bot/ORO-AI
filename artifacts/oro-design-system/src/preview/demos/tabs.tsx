import {useState} from "react";
import * as C from "../../components/ui/tabs";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Tabs" title="Tabs" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.Tabs defaultValue="pending"><C.TabsList><C.TabsTrigger value="pending">Pending</C.TabsTrigger><C.TabsTrigger value="approved">Approved</C.TabsTrigger><C.TabsTrigger value="disabled" disabled>Disabled</C.TabsTrigger></C.TabsList><C.TabsContent value="pending">Draft quotations waiting for a decision.</C.TabsContent><C.TabsContent value="approved">Confirmed appointments.</C.TabsContent></C.Tabs></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
