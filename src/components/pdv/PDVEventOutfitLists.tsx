import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardList, Users, Plus, FileText, Pencil, Search, Shirt, CalendarDays, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { outfitListApi, type OutfitList, type OutfitDetail, type OutfitGroup, type OutfitParticipant, type GroupInput } from '@/lib/eventOutfitLists';
import type { Product } from '@/lib/api';

const ROLES = ['Padrinhos', 'Madrinhas', 'Pai do noivo', 'Mãe do noivo', 'Pai da noiva', 'Mãe da noiva',
  'Pajens', 'Daminhas', 'Noivo', 'Noiva', 'Outros'];
const BLANK_GROUP = { role: '', target_count: 1, garment_color: '', accessory_color: '', garment_notes: '',
  accessory_notes: '', position: 0 };
const BLANK_PERSON = { full_name: '', document: '', phone: '', email: '', notes: '',
  cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '' };
const BLANK_LIST = { organizer_name: '', partner_name: '', event_kind: 'casamento',
  event_date: '', venue: '', phone: '', notes: '' };
const money = (v: number) => Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const dateLabel = (v: string) => v ? new Date(v+'T12:00:00').toLocaleDateString('pt-BR') : '';
const errText = (e: unknown) => e instanceof Error ? e.message : 'Tente novamente.';

interface Props { createSignal?: number }

export default function PDVEventOutfitLists({createSignal=0}: Props) {
  const [lists,setLists] = useState<OutfitList[]>([]);
  const [listId,setListId] = useState('');
  const [detail,setDetail] = useState<OutfitDetail | null>(null);
  const [products,setProducts] = useState<Product[]>([]);
  const [search,setSearch] = useState('');
  const [loading,setLoading] = useState(false);
  const [saving,setSaving] = useState(false);
  const [newOpen,setNewOpen] = useState(false);
  const [newList,setNewList] = useState(BLANK_LIST);
  const [counts,setCounts] = useState<Record<string,number>>(() => Object.fromEntries(ROLES.map(x=>[x,0])));
  const [groupForm,setGroupForm] = useState<(GroupInput & {id?:string;list_id:string}) | null>(null);
  const [ruleGroup,setRuleGroup] = useState<string | null>(null);
  const [ruleKind,setRuleKind] = useState<'traje'|'acessorio'>('traje');
  const [ruleRequired,setRuleRequired] = useState(false);
  const [ruleNote,setRuleNote] = useState('');
  const [ruleSearch,setRuleSearch] = useState('');
  const [personGroup,setPersonGroup] = useState<string | null>(null);
  const [person,setPerson] = useState(BLANK_PERSON);
  const [contractPerson,setContractPerson] = useState<OutfitParticipant | null>(null);
  const [selectedProducts,setSelectedProducts] = useState<string[]>([]);
  const [pickup,setPickup] = useState('');
  const [returnDate,setReturnDate] = useState('');
  const [tryOn,setTryOn] = useState('');
  const [paid,setPaid] = useState('');
  const [paymentMethod,setPaymentMethod] = useState('pix');
  const [paymentConfirmed,setPaymentConfirmed] = useState(false);
  const [stockConfirmed,setStockConfirmed] = useState(false);
  const [contractNotes,setContractNotes] = useState('');
  const requestId=useRef<string|null>(null);
  const [linkPerson,setLinkPerson] = useState<OutfitParticipant | null>(null);
  const [pastContracts,setPastContracts] = useState<Array<{
    id:string;contract_number:number;total:number;status:string;
    rental_items:Array<{product_id:string;event_date:string;status:string}>;
  }>>([]);

  const reloadLists=async(prefer?:string)=>{
    const data=await outfitListApi.getAll(); setLists(data);
    const id=prefer || listId || data[0]?.id || '';
    if(id) setListId(id);
    if(id===listId || prefer) await reloadDetail(id);
  };
  const reloadDetail=async(id:string)=>{
    if(!id) return;
    setDetail(await outfitListApi.getDetail(id));
  };
  useEffect(()=>{void reloadLists().catch(e=>toast({title:'Erro ao carregar listagens',description:errText(e),variant:'destructive'}));},[]);
  useEffect(()=>{if(listId) void reloadDetail(listId).catch(e=>toast({title:'Erro ao abrir listagem',description:errText(e),variant:'destructive'}));},[listId]);
  useEffect(()=>{if(createSignal>0) setNewOpen(true);},[createSignal]);
  useEffect(()=>{void outfitListApi.getCatalogProducts().then(setProducts).catch(e=>console.error(e));},[]);

  const act=(callback:()=>Promise<void>)=>{
    void (async()=>{try{setSaving(true);await callback();}
      catch(e){toast({title:'Não foi possível salvar',description:errText(e),variant:'destructive'});}
      finally{setSaving(false);}})();
  };
  const create=()=>act(async()=>{
    if(!newList.organizer_name.trim() || !newList.event_date) throw new Error('Informe o responsável e a data do evento.');
    const groups:GroupInput[]=Object.entries(counts).filter(([,n])=>n>0).map(([role,target_count],position)=>({
      role,target_count,position,garment_color:null,accessory_color:null,garment_notes:null,accessory_notes:null
    }));
    if(!groups.length) throw new Error('Preencha a quantidade de pelo menos um grupo.');
    const title=newList.event_kind==='casamento'?'Casamento de '+newList.organizer_name.trim()+
      (newList.partner_name.trim()?' e '+newList.partner_name.trim():''):newList.event_kind+' — '+newList.organizer_name.trim();
    const id=await outfitListApi.create({...newList,title,groups});
    setNewOpen(false);setNewList(BLANK_LIST);setCounts(Object.fromEntries(ROLES.map(x=>[x,0])));
    await reloadLists(id);toast({title:'Listagem criada',description:'Defina as cores e os trajes permitidos em cada grupo.'});
  });
  const saveGroup=()=>act(async()=>{
    if(!groupForm || !groupForm.role.trim()) throw new Error('Informe o nome do grupo.');
    await outfitListApi.saveGroup(groupForm);
    setGroupForm(null);await reloadDetail(listId);
    toast({title:'Especificações atualizadas'});
  });
  const addRule=(productId:string)=>act(async()=>{
    if(!ruleGroup) return;
    await outfitListApi.addRule({
      group_id:ruleGroup,product_id:productId,item_kind:ruleKind,required:ruleRequired,notes:ruleNote
    });
    await reloadDetail(listId);setRuleSearch('');
    toast({title:'Modelo incluído nas opções aprovadas'});
  });
  const addPerson=()=>act(async()=>{
    if(!personGroup || !person.full_name.trim()) throw new Error('Informe o nome do participante.');
    if(!person.phone.trim()) throw new Error('Informe um telefone de contato.');
    const cpf=person.document.replace(/\D/g,'');
    if(cpf && cpf.length!==11 && cpf.length!==14) throw new Error('CPF/CNPJ com quantidade de dígitos incorreta.');
    const result=await outfitListApi.addParticipant(personGroup,{
      full_name:person.full_name,document:cpf,phone:person.phone,email:person.email,notes:person.notes,
      address:{cep:person.cep,street:person.street,number:person.number,complement:person.complement,
        neighborhood:person.neighborhood,city:person.city,state:person.state}
    });
    setPersonGroup(null);setPerson(BLANK_PERSON);await reloadDetail(listId);
    toast({title:result.existing_client?'Cliente vinculado sem duplicação':'Cliente cadastrado na listagem'});
  });
  const rulesForContract=useMemo(()=>
    detail?.rules.filter(x=>x.group_id===contractPerson?.group_id)||[],[detail,contractPerson]);
  const contractGroup=detail?.groups.find(x=>x.id===contractPerson?.group_id);
  const total=rulesForContract.filter(x=>selectedProducts.includes(x.product_id)).reduce((sum,x)=>
    sum+Number(x.products?.metadata?.rental_price ?? x.products?.price ?? 0),0);
  const provisional=rulesForContract.some(x=>selectedProducts.includes(x.product_id)
    && x.products?.metadata?.stock_quantity_source==='provisional_1_unit_per_catalog_sku');
  const openContract=(p:OutfitParticipant)=>{
    setContractPerson(p);
    setSelectedProducts((detail?.rules||[]).filter(x=>x.group_id===p.group_id && x.required).map(x=>x.product_id));
    setPickup('');setReturnDate('');setTryOn('');setPaid('');setContractNotes('');
    setPaymentConfirmed(false);setStockConfirmed(false);requestId.current=null;
  };
  const finishContract=()=>act(async()=>{
    if(!contractPerson || !detail) return;
    if(!selectedProducts.length) throw new Error('Escolha ao menos um traje.');
    if(!pickup || !returnDate || pickup>detail.listing.event_date || returnDate<detail.listing.event_date)
      throw new Error('Confira as datas de retirada, evento e devolução.');
    if(tryOn && tryOn>=pickup) throw new Error('A data da prova deve ser anterior à retirada.');
    if(provisional && !stockConfirmed) throw new Error('Confirme a presença física das peças antes de contratar.');
    const value=Number((paid || '0').replace(',','.'));
    if(!Number.isFinite(value) || value<0 || value>total) throw new Error('Valor de pagamento inválido.');
    if(value>0 && !paymentConfirmed) throw new Error('Confirme o recebimento do pagamento.');
    if(!requestId.current) requestId.current=crypto.randomUUID();
    const items=rulesForContract.filter(x=>selectedProducts.includes(x.product_id)).map(x=>({
      product_id:x.product_id,item_type:'rental',quantity:1,
      unit_price:Number(x.products?.metadata?.rental_price ?? x.products?.price ?? 0),
      discount:0,pickup_date:pickup,event_date:detail.listing.event_date,
      return_date:returnDate,...(tryOn?{try_on_date:tryOn}:{})
    }));
    if(!items.some(x=>rulesForContract.some(y=>y.product_id===x.product_id && y.item_kind==='traje')))
      throw new Error('Selecione um traje aprovado além dos acessórios.');
    const result=await outfitListApi.createContract(contractPerson.id,{
      request_id:requestId.current,items,total_discount:0,total:Number(total.toFixed(2)),
      payments:value>0?[{method:paymentMethod,value,installments:1}]:[],
      observations:['Grupo: '+(contractGroup?.role||''),'Cor do traje: '+(contractGroup?.garment_color||'A definir'),
        'Acessórios: '+(contractGroup?.accessory_color||'A definir'),
        contractGroup?.garment_notes||'',contractGroup?.accessory_notes||'',contractNotes].filter(Boolean).join(' | ')
    });
    requestId.current=null;setContractPerson(null);await reloadDetail(listId);
    toast({title:'Contrato ALU-'+String(result.number).padStart(6,'0')+' criado',
      description:'Contrato individual vinculado à listagem e registrado no sistema de locações.'});
  });
  const openLink=(p:OutfitParticipant)=>act(async()=>{
    setLinkPerson(p);setPastContracts(await outfitListApi.findContractsForClient(p.client_id));
  });
  const link=(contractId:string)=>act(async()=>{
    if(!linkPerson) return;
    await outfitListApi.linkContract(linkPerson.id,contractId);
    setLinkPerson(null);await reloadDetail(listId);toast({title:'Contrato vinculado à listagem'});
  });

  const visibleLists=lists.filter(x=>(x.title+' '+x.organizer_name+' '+(x.partner_name||''))
    .toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  const visibleProducts=products.filter(x=>{
    const s=ruleSearch.trim().toLocaleLowerCase('pt-BR');
    return !!s && (x.name+' '+(x.sku||'')+' '+(x.color||'')).toLocaleLowerCase('pt-BR').includes(s);
  }).slice(0,35);
  const registered=detail?.participants.filter(p=>p.status!=='cancelled').length||0;
  const expected=detail?.groups.reduce((sum,g)=>sum+g.target_count,0)||0;
  const signed=detail?.participants.filter(p=>!!p.contract_id && p.status!=='cancelled').length||0;
  const canEdit=!!detail && !['completed','cancelled'].includes(detail.listing.status);

  return <div className="space-y-5">
    <div className="flex flex-wrap justify-between items-center gap-3">
      <div><h2 className="text-xl font-semibold flex items-center gap-2"><ClipboardList className="h-5 w-5 text-marsala"/> Listagens de eventos</h2>
        <p className="text-sm text-neutral-500">Organize padrinhos, madrinhas, pais, pajens, daminhas e contratos por cerimônia.</p></div>
      <Button className="bg-marsala hover:bg-marsala/90" onClick={()=>setNewOpen(true)}><Plus className="w-4 h-4 mr-2"/> Criar listagem</Button>
    </div>
    <div className="grid xl:grid-cols-[270px,minmax(0,1fr)] gap-4">
      <Card><CardHeader className="p-4"><CardTitle className="text-base">Eventos cadastrados</CardTitle></CardHeader>
        <CardContent className="p-3 space-y-2">
          <div className="relative"><Search className="h-4 w-4 absolute left-2.5 top-2.5 text-neutral-400"/>
            <Input placeholder="Buscar evento ou noivos" className="pl-9" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <div className="max-h-[650px] space-y-2 overflow-auto">
            {visibleLists.map(l=><button key={l.id} type="button" onClick={()=>setListId(l.id)}
              className={'w-full border rounded-lg p-3 text-left hover:bg-neutral-50 '+(listId===l.id?'border-marsala bg-marsala/5':'')}>
              <b className="text-sm">{l.title}</b><p className="text-xs text-neutral-500">{dateLabel(l.event_date)} · {l.status}</p>
            </button>)}
            {!visibleLists.length && <p className="text-sm text-neutral-500 p-2">Nenhuma listagem cadastrada.</p>}
          </div>
        </CardContent></Card>
      <div className="space-y-4 min-w-0">
        {detail && detail.listing.id===listId ? <>
          <Card><CardHeader className="p-4"><CardTitle>{detail.listing.title}</CardTitle>
            <p className="text-sm text-neutral-500 flex items-center gap-2">
              <CalendarDays className="w-4 h-4"/> {dateLabel(detail.listing.event_date)} · {detail.listing.venue||'Local a definir'}</p>
            {detail.listing.phone && <p className="text-sm text-neutral-500">Contato: {detail.listing.phone}</p>}
            {detail.listing.notes && <p className="text-sm text-neutral-500">{detail.listing.notes}</p>}
          </CardHeader><CardContent className="p-4 pt-0">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['Previstos',expected],['Cadastrados',registered],['Com contrato',signed]].map(([name,qty])=>
                <div key={String(name)} className="rounded-lg bg-neutral-50 p-3">
                  <b className="text-xl">{qty}</b><p className="text-xs text-neutral-500">{name}</p></div>)}
            </div>
            {expected>0 && <div className="rounded-full bg-neutral-100 h-2 mt-3 overflow-hidden">
              <div className="bg-marsala h-full" style={{width:Math.min(100,signed*100/expected)+'%'}}/></div>}
            {canEdit && <Button variant="outline" size="sm" className="mt-3" onClick={()=>setGroupForm({...BLANK_GROUP,list_id:listId,position:detail.groups.length})}>
              <Plus className="w-4 h-4 mr-1"/> Adicionar grupo</Button>}
          </CardContent></Card>
          {detail.groups.map(g=>{
            const participants=detail.participants.filter(p=>p.group_id===g.id);
            const groupRules=detail.rules.filter(p=>p.group_id===g.id);
            const contracted=participants.filter(p=>!!p.contract_id && p.status!=='cancelled').length;
            return <Card key={g.id}>
              <CardHeader className="p-4"><div className="flex flex-wrap items-center justify-between gap-3">
                <div><CardTitle className="text-lg flex gap-2 items-center"><Users className="w-5 h-5 text-marsala"/>{g.role}
                  <Badge variant="outline">{contracted}/{g.target_count} contratos</Badge></CardTitle>
                  <p className="text-xs text-neutral-500 mt-1">{participants.length} cadastrados · Meta {g.target_count}</p></div>
                {canEdit && <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={()=>setGroupForm({...g})}><Pencil className="h-4 w-4 mr-1"/> Regras</Button>
                  <Button size="sm" variant="outline" onClick={()=>{setRuleGroup(g.id);setRuleSearch('');setRuleKind('traje');setRuleRequired(false);setRuleNote('');}}>
                    <Shirt className="h-4 w-4 mr-1"/> Modelos</Button>
                  <Button size="sm" className="bg-marsala hover:bg-marsala/90"
                    onClick={()=>{setPerson(BLANK_PERSON);setPersonGroup(g.id);}}>
                    <Plus className="h-4 w-4 mr-1"/> Participante</Button></div>}
              </div></CardHeader><CardContent className="p-4 pt-0 space-y-4">
                <div className="grid md:grid-cols-2 gap-3 bg-neutral-50 p-3 rounded-lg text-sm">
                  <div><b>Cor do traje:</b> {g.garment_color||'A definir'}<p className="text-xs text-neutral-500">{g.garment_notes}</p></div>
                  <div><b>Acessórios:</b> {g.accessory_color||'A definir'}<p className="text-xs text-neutral-500">{g.accessory_notes}</p></div></div>
                <div><p className="text-sm font-semibold mb-2">Peças escolhidas para o grupo</p>
                  {!groupRules.length && <p className="text-sm text-amber-700">Aguarde a escolha dos modelos pelos responsáveis antes de fazer contratos.</p>}
                  <div className="grid sm:grid-cols-2 gap-2">{groupRules.map(r=><div key={r.id} className="border rounded-lg p-2 flex gap-2 items-center">
                    {r.products?.product_images?.[0]?.url && <img alt="" className="w-12 h-14 rounded object-cover" src={r.products.product_images[0].url}/>}
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{r.products?.name}</p>
                      <p className="text-xs text-neutral-500">{r.products?.sku} · {r.item_kind==='traje'?'Traje':'Acessório'} {r.required?'· Obrigatório':''}</p>
                      {r.notes && <p className="text-xs text-neutral-500">{r.notes}</p>}</div>
                    {canEdit && <Button size="icon" variant="ghost" title="Remover modelo" onClick={()=>{
                      if(!window.confirm('Remover opção aprovada? Contratos já vinculados preservam o histórico.'))return;
                      act(async()=>{await outfitListApi.removeRule(r.id);await reloadDetail(listId);});
                    }}><Trash2 className="w-4 h-4"/></Button>}
                  </div>)}</div>
                </div>
                {participants.length>0 && <div className="space-y-2">
                  <p className="font-semibold text-sm">Participantes e contratos individuais</p>
                  {participants.map(p=><div className="p-3 border rounded-lg flex flex-col md:flex-row gap-2 justify-between md:items-center" key={p.id}>
                    <div><p className="text-sm font-medium">{p.clients?.full_name}</p>
                      <p className="text-xs text-neutral-500">{p.clients?.document||'CPF pendente'} · {p.clients?.phone||'Sem telefone'}</p>
                      {p.contract_id && <p className="text-xs text-marsala font-medium">ALU-{String(p.rental_contracts?.contract_number||'').padStart(6,'0')} · {p.rental_contracts?.status}</p>}
                      {p.notes && <p className="text-xs text-neutral-500">{p.notes}</p>}
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <Badge variant={p.contract_id?'outline':'secondary'}>{p.contract_id?'Contrato vinculado':p.status==='pending'?'Sem contrato':p.status}</Badge>
                      {canEdit && !p.contract_id && <>
                        <Button size="sm" variant="outline" onClick={()=>openLink(p)}>Vincular existente</Button>
                        <Button size="sm" className="bg-marsala hover:bg-marsala/90" onClick={()=>openContract(p)}>
                          <FileText className="w-4 h-4 mr-1"/> Fazer contrato</Button>
                      </>}
                    </div>
                  </div>)}</div>}
              </CardContent></Card>;
          })}
        </> : <Card><CardContent className="p-8 text-center text-neutral-500">Selecione ou crie uma listagem para começar.</CardContent></Card>}
      </div>
    </div>

    <Dialog open={newOpen} onOpenChange={setNewOpen}><DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Criar listagem de casamento / evento</DialogTitle></DialogHeader>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><Label>Noiva ou responsável *</Label><Input value={newList.organizer_name} onChange={e=>setNewList(s=>({...s,organizer_name:e.target.value}))}/></div>
        <div><Label>Noivo ou segundo responsável</Label><Input value={newList.partner_name} onChange={e=>setNewList(s=>({...s,partner_name:e.target.value}))}/></div>
        <div><Label>Tipo de evento</Label><Select value={newList.event_kind} onValueChange={v=>setNewList(s=>({...s,event_kind:v}))}>
          <SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
            <SelectItem value="casamento">Casamento</SelectItem><SelectItem value="debutante">Debutante</SelectItem>
            <SelectItem value="formatura">Formatura</SelectItem><SelectItem value="outro">Outro</SelectItem>
          </SelectContent></Select></div>
        <div><Label>Data do evento *</Label><Input type="date" value={newList.event_date} onChange={e=>setNewList(s=>({...s,event_date:e.target.value}))}/></div>
        <div><Label>Local</Label><Input value={newList.venue} onChange={e=>setNewList(s=>({...s,venue:e.target.value}))}/></div>
        <div><Label>Telefone dos responsáveis</Label><Input value={newList.phone} onChange={e=>setNewList(s=>({...s,phone:e.target.value}))}/></div>
      </div>
      <div><Label>Observações gerais</Label><Textarea value={newList.notes} onChange={e=>setNewList(s=>({...s,notes:e.target.value}))}/></div>
      <div><p className="text-sm font-semibold mb-2">Quantidade de trajes prevista</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ROLES.map(role=><div key={role}><Label className="text-xs">{role}</Label>
            <Input type="number" min={0} max={500} value={counts[role]||0}
              onChange={e=>setCounts(s=>({...s,[role]:Math.max(0,Math.min(500,Number(e.target.value)||0))}))}/></div>)}
        </div><p className="text-xs text-neutral-500 mt-2">É possível adicionar grupos personalizados depois.</p>
      </div>
      <DialogFooter><Button variant="outline" onClick={()=>setNewOpen(false)}>Cancelar</Button>
        <Button className="bg-marsala hover:bg-marsala/90" disabled={saving} onClick={create}>{saving?'Salvando...':'Criar listagem'}</Button></DialogFooter>
    </DialogContent></Dialog>

    <Dialog open={!!groupForm} onOpenChange={v=>{if(!v)setGroupForm(null)}}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Regras de vestuário do grupo</DialogTitle></DialogHeader>
        {groupForm && <>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Nome do grupo *</Label><Input value={groupForm.role} onChange={e=>setGroupForm(s=>s?{...s,role:e.target.value}:null)}/></div>
            <div><Label>Quantidade prevista</Label><Input type="number" min={0} max={500} value={groupForm.target_count} onChange={e=>setGroupForm(s=>s?{...s,target_count:Number(e.target.value)}:null)}/></div>
            <div><Label>Cor dos trajes</Label><Input value={groupForm.garment_color||''} onChange={e=>setGroupForm(s=>s?{...s,garment_color:e.target.value}:null)}/></div>
            <div><Label>Cor dos acessórios</Label><Input value={groupForm.accessory_color||''} onChange={e=>setGroupForm(s=>s?{...s,accessory_color:e.target.value}:null)}/></div>
          </div>
          <div><Label>Especificações dos trajes</Label><Textarea rows={3} value={groupForm.garment_notes||''} onChange={e=>setGroupForm(s=>s?{...s,garment_notes:e.target.value}:null)}/></div>
          <div><Label>Especificações dos acessórios</Label><Textarea rows={3} value={groupForm.accessory_notes||''} onChange={e=>setGroupForm(s=>s?{...s,accessory_notes:e.target.value}:null)}/></div>
          <DialogFooter><Button variant="outline" onClick={()=>setGroupForm(null)}>Cancelar</Button>
            <Button disabled={saving} className="bg-marsala hover:bg-marsala/90" onClick={saveGroup}>Salvar regras</Button></DialogFooter>
        </>}
      </DialogContent>
    </Dialog>

    <Dialog open={!!ruleGroup} onOpenChange={v=>{if(!v)setRuleGroup(null)}}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Selecionar trajes e acessórios aprovados</DialogTitle></DialogHeader>
        <p className="text-sm text-neutral-500">Apenas os modelos escolhidos aqui poderão entrar nos contratos do grupo.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Tipo de peça</Label><Select value={ruleKind} onValueChange={v=>setRuleKind(v as 'traje'|'acessorio')}>
            <SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="traje">Traje / vestido / terno</SelectItem>
              <SelectItem value="acessorio">Acessório</SelectItem></SelectContent></Select></div>
          <label className="flex items-end pb-3 gap-2 text-sm"><input type="checkbox" checked={ruleRequired} onChange={e=>setRuleRequired(e.target.checked)}/> Obrigatório para todos</label>
        </div>
        <div><Label>Observação</Label><Input placeholder="Modelo, tecido ou acabamento obrigatório" value={ruleNote} onChange={e=>setRuleNote(e.target.value)}/></div>
        <div><Label>Buscar produto por nome, SKU ou cor</Label><Input value={ruleSearch} onChange={e=>setRuleSearch(e.target.value)} placeholder="Digite o código do produto"/></div>
        <div className="max-h-[340px] overflow-y-auto space-y-2">
          {visibleProducts.map(p=>{
            const duplicate=detail?.rules.some(x=>x.group_id===ruleGroup && x.product_id===p.id);
            return <div key={p.id} className="flex items-center gap-3 rounded-lg border p-2">
              {p.image && <img src={p.image} alt="" className="h-12 w-10 object-cover rounded"/>}
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{p.name}</p>
                <p className="text-xs text-neutral-500">{p.sku} · {money(p.rental_price??p.price)}</p></div>
              <Button size="sm" disabled={saving||duplicate} variant="outline" onClick={()=>addRule(p.id)}>{duplicate?'Adicionado':'Adicionar'}</Button>
            </div>;
          })}
          {!ruleSearch && <p className="text-sm text-neutral-500">Pesquise um produto para adicioná-lo às opções dos noivos.</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={()=>setRuleGroup(null)}>Concluir</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!personGroup} onOpenChange={v=>{if(!v)setPersonGroup(null)}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Cadastrar padrinho, madrinha ou participante</DialogTitle></DialogHeader>
        <p className="text-sm text-neutral-500">CPF já cadastrado será reutilizado, sem duplicar o cliente. Para menores, indique o responsável nas observações.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Label>Nome completo *</Label><Input value={person.full_name} onChange={e=>setPerson(s=>({...s,full_name:e.target.value}))}/></div>
          <div><Label>CPF</Label><Input value={person.document} onChange={e=>setPerson(s=>({...s,document:e.target.value}))} placeholder="000.000.000-00"/></div>
          <div><Label>Telefone / WhatsApp *</Label><Input value={person.phone} onChange={e=>setPerson(s=>({...s,phone:e.target.value}))}/></div>
          <div className="sm:col-span-2"><Label>E-mail</Label><Input type="email" value={person.email} onChange={e=>setPerson(s=>({...s,email:e.target.value}))}/></div>
          <div><Label>CEP</Label><Input value={person.cep} onChange={e=>setPerson(s=>({...s,cep:e.target.value}))}/></div>
          <div><Label>Cidade</Label><Input value={person.city} onChange={e=>setPerson(s=>({...s,city:e.target.value}))}/></div>
          <div className="sm:col-span-2"><Label>Rua / avenida</Label><Input value={person.street} onChange={e=>setPerson(s=>({...s,street:e.target.value}))}/></div>
          <div><Label>Número</Label><Input value={person.number} onChange={e=>setPerson(s=>({...s,number:e.target.value}))}/></div>
          <div><Label>Complemento</Label><Input value={person.complement} onChange={e=>setPerson(s=>({...s,complement:e.target.value}))}/></div>
          <div><Label>Bairro</Label><Input value={person.neighborhood} onChange={e=>setPerson(s=>({...s,neighborhood:e.target.value}))}/></div>
          <div><Label>UF</Label><Input maxLength={2} value={person.state} onChange={e=>setPerson(s=>({...s,state:e.target.value.toUpperCase()}))}/></div>
        </div>
        <div><Label>Observações / responsável por menor</Label><Textarea value={person.notes} onChange={e=>setPerson(s=>({...s,notes:e.target.value}))}/></div>
        <DialogFooter><Button variant="outline" onClick={()=>setPersonGroup(null)}>Cancelar</Button>
          <Button disabled={saving} className="bg-marsala hover:bg-marsala/90" onClick={addPerson}>Cadastrar cliente e vincular</Button></DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!contractPerson} onOpenChange={v=>{if(!v)setContractPerson(null)}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Contrato individual da listagem</DialogTitle></DialogHeader>
        <p className="text-sm text-neutral-500">{contractPerson?.clients?.full_name} · {contractGroup?.role} · Evento {dateLabel(detail?.listing.event_date||'')}</p>
        <p className="text-sm text-neutral-500">Selecione apenas modelos escolhidos pelos responsáveis. A função oficial de aluguel verifica disponibilidade, datas e cria a numeração real.</p>
        <div className="space-y-2"><Label>Peças permitidas no contrato</Label>
          {rulesForContract.map(r=><label key={r.id} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer">
            <input type="checkbox" checked={selectedProducts.includes(r.product_id)} disabled={r.required}
              onChange={e=>setSelectedProducts(ids=>e.target.checked?[...ids,r.product_id]:ids.filter(id=>id!==r.product_id))}/>
            <div className="flex-1"><p className="text-sm font-medium">{r.products?.name}</p>
              <p className="text-xs text-neutral-500">{r.item_kind==='traje'?'Traje':'Acessório'} {r.required?'· Obrigatório':''}</p></div>
            <b className="text-sm">{money(Number(r.products?.metadata?.rental_price??r.products?.price??0))}</b>
          </label>)}
          {!rulesForContract.length && <p className="text-sm text-amber-700">Primeiro defina os trajes e acessórios aprovados no grupo.</p>}
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div><Label>Prova (opcional)</Label><Input type="date" value={tryOn} onChange={e=>setTryOn(e.target.value)}/></div>
          <div><Label>Retirada *</Label><Input type="date" value={pickup} onChange={e=>setPickup(e.target.value)}/></div>
          <div><Label>Devolução *</Label><Input type="date" value={returnDate} onChange={e=>setReturnDate(e.target.value)}/></div>
        </div>
        <div><Label>Observações do contrato</Label><Textarea value={contractNotes} onChange={e=>setContractNotes(e.target.value)}/></div>
        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex justify-between font-semibold"><span>Valor total</span><span>{money(total)}</span></div>
          <p className="text-xs text-neutral-500">Pagamento inicial opcional. Registre somente valores efetivamente recebidos; caso contrário, deixe zero.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Valor recebido (R$)</Label><Input inputMode="decimal" value={paid} onChange={e=>setPaid(e.target.value)} placeholder="0,00"/></div>
            <div><Label>Forma do pagamento</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
                <SelectItem value="pix">Pix</SelectItem><SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem><SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
              </SelectContent></Select></div>
          </div>
          {Number((paid||'0').replace(',','.'))>0 && <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={paymentConfirmed} onChange={e=>setPaymentConfirmed(e.target.checked)}/> Confirmo que o pagamento foi recebido</label>}
        </div>
        {provisional && <label className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-800">
          <input type="checkbox" className="mt-1" checked={stockConfirmed} onChange={e=>setStockConfirmed(e.target.checked)}/>
          Conferi a presença física do traje na loja. O estoque foi importado com quantidade provisória.</label>}
        <DialogFooter><Button variant="outline" onClick={()=>setContractPerson(null)}>Cancelar</Button>
          <Button disabled={saving||!rulesForContract.length} onClick={finishContract} className="bg-marsala hover:bg-marsala/90">Gerar contrato e vincular</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={!!linkPerson} onOpenChange={v=>{if(!v)setLinkPerson(null)}}>
      <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Vincular contrato existente</DialogTitle></DialogHeader>
        <p className="text-sm text-neutral-500">Cliente: {linkPerson?.clients?.full_name}. O sistema verifica o cliente, a data e os produtos definidos pelos noivos.</p>
        <div className="space-y-2">{pastContracts.filter(c=>c.rental_items?.some(x=>x.event_date===detail?.listing.event_date && x.status!=='cancelled'))
          .map(c=><div className="flex items-center justify-between p-3 border rounded-lg" key={c.id}>
            <div><p className="font-medium text-sm">ALU-{String(c.contract_number).padStart(6,'0')}</p>
              <p className="text-xs text-neutral-500">{money(c.total)} · {c.status}</p></div>
            <Button variant="outline" size="sm" disabled={saving} onClick={()=>link(c.id)}>Vincular</Button>
          </div>)}
          {pastContracts.length===0 && <p className="text-sm text-neutral-500">Nenhum contrato encontrado para esse cliente.</p>}
        </div>
        <DialogFooter><Button variant="outline" onClick={()=>setLinkPerson(null)}>Fechar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
