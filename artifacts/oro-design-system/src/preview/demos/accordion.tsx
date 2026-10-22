import {useState} from "react";
import * as C from "../../components/ui/accordion";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Accordion" title="Accordion" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><><C.Accordion type="single" collapsible className="w-full"><C.AccordionItem value="price"><C.AccordionTrigger>Where do prices come from?</C.AccordionTrigger><C.AccordionContent>The approved price list.</C.AccordionContent></C.AccordionItem><C.AccordionItem value="crew"><C.AccordionTrigger>When is the crew booked?</C.AccordionTrigger><C.AccordionContent>After manager approval.</C.AccordionContent></C.AccordionItem></C.Accordion><C.Accordion type="multiple" defaultValue={["one"]}><C.AccordionItem value="one"><C.AccordionTrigger>Multiple selection</C.AccordionTrigger><C.AccordionContent>Can stay expanded with other sections.</C.AccordionContent></C.AccordionItem></C.Accordion></></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
