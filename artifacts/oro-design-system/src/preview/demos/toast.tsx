import { Button } from "../../components/ui/button";
import { Toaster } from "../../components/ui/toaster";
import { ToastAction } from "../../components/ui/toast";
import { toast } from "../../hooks/use-toast";
import { Title } from "../foundations";
export default function Demo(){return <><Title eyebrow="Feedback / Toast" title="Toast notifications" sub="The original Radix Toast provider, viewport, dismiss action and shared use-toast store. Starts closed."/><div className="ds-panel flex flex-wrap gap-3"><Button onClick={()=>toast({title:"Preview confirmed",description:"No live quotation was changed.",action:<ToastAction altText="Dismiss preview">Got it</ToastAction>})}>Show notification</Button><Button variant="destructive" onClick={()=>toast({variant:"destructive",title:"Preview conflict",description:"Choose a different appointment."})}>Show error</Button><Button variant="outline" onClick={()=>toast({title:"Persistent preview",description:"Dismiss or swipe this notification.",duration:Infinity})}>Persistent</Button></div><Toaster/></>}
