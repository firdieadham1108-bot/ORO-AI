import {useState} from "react";
import * as C from "../../components/ui/breadcrumb";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Breadcrumb" title="Breadcrumb" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><C.Breadcrumb><C.BreadcrumbList><C.BreadcrumbItem><C.BreadcrumbLink href="#page=overview">Home</C.BreadcrumbLink></C.BreadcrumbItem><C.BreadcrumbSeparator/><C.BreadcrumbItem><C.BreadcrumbEllipsis/></C.BreadcrumbItem><C.BreadcrumbSeparator/><C.BreadcrumbItem><C.BreadcrumbPage>Quotations</C.BreadcrumbPage></C.BreadcrumbItem></C.BreadcrumbList></C.Breadcrumb></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
