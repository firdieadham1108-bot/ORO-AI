import { lazy, type ComponentType } from "react";
import { OverviewPage, ColorsPage, FontsPage, LayoutPage, LogoPage, InventoryPage } from "./foundations";
export const DESIGN_SYSTEM = {title:"ORO AI Design System",description:"The existing product's visual language, extracted without changing its screens."};
export type NavGroup = {name:string;entries:{id:string;name:string;Page:ComponentType}[]};
export const OVERVIEW_ENTRY = {id:"overview",name:"Overview",Page:OverviewPage};
export const NAV_GROUPS:NavGroup[] = [
  {name:"Brand",entries:[{id:"brand-logo",name:"Penguin logo",Page:LogoPage}]},
  {name:"Colors",entries:[{id:"colors",name:"Palette & status",Page:ColorsPage}]},
  {name:"Fonts",entries:[{id:"fonts",name:"Typography",Page:FontsPage}]},
  {name:"Layout",entries:[{id:"layout",name:"Spacing & surfaces",Page:LayoutPage}]},
  {name:"Components · pilot",entries:[
    {id:"status-badges",name:"Status badges",Page:lazy(()=>import("./demos/status-badges"))},
    {id:"page-header",name:"Page header",Page:lazy(()=>import("./demos/page-header"))},
    {id:"empty-state",name:"Empty state",Page:lazy(()=>import("./demos/empty-state"))},
    {id:"skeleton-rows",name:"Skeleton rows",Page:lazy(()=>import("./demos/skeleton-rows"))},
    {id:"button",name:"Button",Page:lazy(()=>import("./demos/button"))},
  ]},
  {name:"Extraction",entries:[{id:"inventory",name:"Component inventory",Page:InventoryPage}]},
];
export const ALL_ENTRIES=[OVERVIEW_ENTRY,...NAV_GROUPS.flatMap(g=>g.entries)];
