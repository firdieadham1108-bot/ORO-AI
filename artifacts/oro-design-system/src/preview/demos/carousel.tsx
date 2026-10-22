import {useState} from "react";
import * as C from "../../components/ui/carousel";
import {Button} from "../../components/ui/button";
import {Input} from "../../components/ui/input";
import {Inbox} from "lucide-react";
import {Title} from "../foundations";
export default function Demo(){
const [checked,setChecked]=useState(false);const [text,setText]=useState("");const [count,setCount]=useState(35);const [selected,setSelected]=useState("a");const [date,setDate]=useState<Date|undefined>();
return <><Title eyebrow="Components / Carousel" title="Carousel" sub="Source-preserved ORO AI primitive. Interactive examples affect this preview only."/><div className="ds-panel space-y-5"><div className="px-12 max-w-xl"><C.Carousel><C.CarouselContent>{[1,2,3].map(n=><C.CarouselItem key={n}><div className="aspect-video bg-muted flex items-center justify-center rounded-xl">Preview slide {n}</div></C.CarouselItem>)}</C.CarouselContent><C.CarouselPrevious/><C.CarouselNext/></C.Carousel></div></div>{text&&<p className="mt-4 text-sm text-muted-foreground" role="status">{text}</p>}</>;
}
