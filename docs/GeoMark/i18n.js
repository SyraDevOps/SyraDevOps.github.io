export const messages={
  'pt-BR':{settings:'Configurações',appearance:'Aparência',language:'Idioma',about:'Sobre',save:'Salvar',theme:'Tema',primary:'Cor primária',secondary:'Cor secundária',system:'Sistema',map:'Mapa',profile:'Perfil',logout:'Sair'},
  en:{settings:'Settings',appearance:'Appearance',language:'Language',about:'About',save:'Save',theme:'Theme',primary:'Primary color',secondary:'Secondary color',system:'System',map:'Map',profile:'Profile',logout:'Sign out'},
  es:{settings:'Configuración',appearance:'Apariencia',language:'Idioma',about:'Acerca de',save:'Guardar',theme:'Tema',primary:'Color primario',secondary:'Color secundario',system:'Sistema',map:'Mapa',profile:'Perfil',logout:'Salir'}
};
export const t=(locale,key)=>messages[locale]?.[key]||messages['pt-BR'][key]||key;
export function applyTheme(p={}){const r=document.documentElement;r.style.setProperty('--blue',p.primary||'#168fff');r.style.setProperty('--cyan',p.secondary||'#62e8ff');r.style.setProperty('--accent',p.primary||'#168fff');}
