(()=>{
  const academy=document.querySelector('.academy-screen'),menu=document.querySelector('.aurora-menu'),home=document.querySelector('.academy-home'),quiz=document.querySelector('.academy-quiz'),lab=document.querySelector('.constellation-lab'),codex=document.querySelector('.menu-achievements-screen');
  const profileKey='aurora-academy-v3',legacyProfileKey='aurora-academy-v2',achievementKey='aurora-achievements';
  const copy=()=>translations[document.documentElement.lang]||translations['pt-BR'];
  const defaults=()=>({name:'',avatar:'female',xp:0,streak:0,bestStreak:0,progress:{fundamental:[],medium:[],advanced:[],higher:[]},constellations:[]});
  const load=()=>{try{const raw=JSON.parse(localStorage.getItem(profileKey)||localStorage.getItem(legacyProfileKey)||'{}')||{};return {...defaults(),...raw,progress:{...defaults().progress,...raw.progress},constellations:Array.isArray(raw.constellations)?raw.constellations:[]};}catch{return defaults();}};
  let profile=load(),level='fundamental',question=0,answered=false,sequenceSelected=[],constellIndex=0,selectedStar=null,builtEdges=[];
  const maps=[
    {id:'orion',points:[[64,48],[148,90],[211,55],[290,126],[362,181],[160,164]],edges:[[0,1],[1,2],[1,5],[2,3],[3,4],[3,5]]},
    {id:'crux',points:[[210,28],[210,208],[126,115],[294,115],[180,166]],edges:[[0,1],[2,3],[0,4],[4,1]]},
    {id:'cassiopeia',points:[[42,165],[118,62],[202,166],[287,58],[372,146]],edges:[[0,1],[1,2],[2,3],[3,4]]},
    {id:'ursaMajor',points:[[50,70],[110,98],[172,83],[235,115],[294,70],[350,108],[368,172]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]},
    {id:'scorpius',points:[[55,42],[105,76],[148,112],[190,148],[230,128],[274,167],[316,208]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]},
    {id:'cygnus',points:[[210,28],[210,90],[210,154],[210,225],[126,116],[294,116]],edges:[[0,1],[1,2],[2,3],[1,4],[1,5]]},
    {id:'lyra',points:[[210,35],[152,112],[202,166],[272,112],[210,224]],edges:[[0,1],[1,2],[2,3],[3,1],[2,4]]},
    {id:'taurus',points:[[76,98],[132,58],[194,105],[244,56],[297,107],[194,178]],edges:[[0,1],[1,2],[2,3],[3,4],[2,5]]},
    {id:'gemini',points:[[108,42],[151,92],[133,170],[110,228],[274,42],[244,95],[264,175],[288,228]],edges:[[0,1],[1,2],[2,3],[4,5],[5,6],[6,7],[1,5]]},
    {id:'leo',points:[[65,147],[112,92],[168,62],[220,92],[210,154],[272,183],[350,138]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6]]},
    {id:'aquila',points:[[98,168],[168,108],[218,56],[258,117],[330,162]],edges:[[0,1],[1,2],[2,3],[3,4]]},
    {id:'sagittarius',points:[[85,70],[163,66],[238,105],[312,76],[337,167],[230,205],[118,181]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]]},
    {id:'andromeda',points:[[48,184],[106,139],[166,103],[225,65],[287,99],[354,48]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5]]},
    {id:'pegasus',points:[[99,62],[241,50],[321,143],[176,186],[110,230]],edges:[[0,1],[1,2],[2,3],[3,0],[3,4]]},
    {id:'virgo',points:[[114,45],[197,93],[272,43],[206,155],[207,232]],edges:[[0,1],[1,2],[1,3],[3,4]]},
    {id:'canisMajor',points:[[60,74],[129,119],[190,79],[250,134],[322,204]],edges:[[0,1],[1,2],[2,3],[3,4]]},
    {id:'canisMinor',points:[[120,190],[284,71]],edges:[[0,1]]},
    {id:'centaurus',points:[[82,50],[140,106],[211,158],[286,214],[254,104],[350,49]],edges:[[0,1],[1,2],[2,3],[2,4],[4,5]]}
  ];
  const save=()=>localStorage.setItem(profileKey,JSON.stringify(profile));
  const achievements=()=>{try{return JSON.parse(localStorage.getItem(achievementKey))||[];}catch{return [];}};
  const unlock=id=>{const items=achievements();if(items.includes(id))return false;items.push(id);localStorage.setItem(achievementKey,JSON.stringify(items));return true;};
  const shuffle=items=>items.map((value,index)=>({value,index,order:Math.random()})).sort((a,b)=>a.order-b.order);
  const edgeKey=edge=>edge.slice().sort((a,b)=>a-b).join('-');
  const mapTitle=map=>copy().constellationNames?.[map.id]||map.id;
  const bank=id=>copy().studyBanks[id]||[];
  const mastered=id=>profile.progress[id]?.length||0;
  const crownLevel=id=>{const value=mastered(id),total=bank(id).length||8;if(value>=total)return 3;if(value>=Math.ceil(total*.75))return 2;if(value>=Math.ceil(total*.375))return 1;return 0;};
  const crown=id=>['none','bronze','silver','gold'][crownLevel(id)];
  const rank=()=>Math.floor(profile.xp/80)+1,rankXP=()=>profile.xp%80;
  const courseUnlocked=id=>{const order=Object.keys(copy().studyLevels),index=order.indexOf(id),need=[0,3,4,5];return index===0||mastered(order[index-1])>=need[index];};
  const courseTotal=()=>Object.values(copy().studyBanks).reduce((sum,items)=>sum+items.length,0);
  const allGolden=()=>Object.keys(copy().studyLevels).every(id=>crown(id)==='gold');
  const renderProfile=()=>{
    const t=copy(),input=document.querySelector('[data-profile-name]');if(!input)return;
    if(document.activeElement!==input)input.value=profile.name;
    document.querySelector('[data-profile-level]').textContent=rank();document.querySelector('[data-profile-xp]').textContent=profile.xp;document.querySelector('[data-profile-streak]').textContent=profile.streak;
    document.querySelector('[data-profile-xp-bar]').style.width=(rankXP()/80*100)+'%';document.querySelector('[data-profile-xp-copy]').textContent=rankXP()+' / 80 XP';
    document.querySelector('[data-academy-question-total]').textContent=courseTotal();document.querySelectorAll('[data-avatar]').forEach(button=>button.classList.toggle('selected',button.dataset.avatar===profile.avatar));
    document.querySelector('[data-constellation-home-copy]').textContent=t.constellationLabCopy+' · '+profile.constellations.length+'/'+maps.length+' '+t.mapsCompleteLabel;
  };
  const renderHome=()=>{
    const t=copy(),grid=document.querySelector('[data-level-grid]');renderProfile();grid.innerHTML='';
    Object.entries(t.studyLevels).forEach(([id,item])=>{
      const total=mastered(id),tone=crown(id),allowed=courseUnlocked(id),current=crownLevel(id),button=document.createElement('button');button.type='button';button.className='level-card '+(tone!=='none'?'crown-'+tone:'')+' '+(allowed?'':'locked');button.disabled=!allowed;
      const crowns=['bronze','silver','gold'].map((color,index)=>'<i class="course-crown '+(current>index?'filled '+color:'')+'">★</i>').join('');
      button.innerHTML='<span>'+item.tag+'</span><b>'+item.name+'</b><small>'+item.copy+'</small><footer><em>'+crowns+'</em><strong>'+total+'/'+bank(id).length+'</strong></footer><small class="course-state">'+t.crowns[tone]+' · '+t.courseProgress+'</small>'+(allowed?'':'<u>'+t.courseLocked+'</u>');
      button.addEventListener('click',()=>startLevel(id));grid.append(button);
    });
  };
  const open=()=>{menu.hidden=true;academy.hidden=false;home.hidden=false;quiz.hidden=true;lab.hidden=true;renderHome();};
  const close=()=>{academy.hidden=true;menu.hidden=false;menu.style.display='flex';};
  const startLevel=id=>{level=id;question=0;home.hidden=true;quiz.hidden=false;lab.hidden=true;renderQuestion();};
  const tutorFor=item=>item.mode==='sequence'||question%3===2?{src:'assets/academy/json-studying.webp',speaker:'JSON'}:{src:'assets/academy/aurora-tutor.webp',speaker:'AURORA'};
  const renderQuestion=()=>{
    const t=copy(),item=bank(level)[question],meta=t.studyLevels[level],image=document.querySelector('[data-study-image]'),formula=document.querySelector('[data-study-formula]'),tutor=tutorFor(item);answered=false;sequenceSelected=[];
    document.querySelector('[data-study-level]').textContent=meta.name;document.querySelector('[data-study-progress]').textContent=(question+1)+' / '+bank(level).length;document.querySelector('[data-study-type]').textContent=item.type;document.querySelector('[data-study-title]').textContent=item.title;document.querySelector('[data-study-context]').textContent=item.context;
    document.querySelector('[data-study-tutor-art]').src=tutor.src;document.querySelector('[data-study-tutor-art]').alt=tutor.speaker;document.querySelector('[data-study-speaker]').textContent=tutor.speaker==='JSON'?'JSON':t.academyGuideEyebrow;document.querySelector('[data-study-dialogue]').textContent=item.tutor||t.academyDialogues[level][question%t.academyDialogues[level].length];document.querySelector('[data-study-mode-label]').textContent=t.modeLabels[item.mode||'choice'];
    formula.hidden=!item.formula;formula.textContent=item.formula||'';image.hidden=!item.image;if(item.image){image.querySelector('img').src=item.image;image.querySelector('img').alt=item.title;}
    const answers=document.querySelector('[data-study-answers]');answers.innerHTML='';answers.classList.toggle('sequence-mode',item.mode==='sequence');document.querySelector('[data-study-instruction]').textContent=item.mode==='sequence'?t.sequenceInstruction:t.choiceInstruction;document.querySelector('[data-study-feedback]').hidden=true;
    if(item.mode==='sequence'){shuffle(item.sequence).forEach(choice=>{const button=document.createElement('button');button.type='button';button.className='study-answer sequence-choice';button.textContent=choice.value;button.dataset.answerIndex=choice.index;button.addEventListener('click',()=>chooseSequence(choice.index,button));answers.append(button);});return;}
    shuffle(item.answers).forEach(choice=>{const button=document.createElement('button');button.type='button';button.className='study-answer';button.textContent=choice.value;button.dataset.answerIndex=choice.index;button.addEventListener('click',()=>finishStudy(choice.index===item.correct,choice.index));answers.append(button);});
  };
  const awardStudy=correct=>{
    if(!correct){profile.streak=0;save();return 0;}
    profile.streak++;profile.bestStreak=Math.max(profile.bestStreak,profile.streak);const record=profile.progress[level]||(profile.progress[level]=[]),fresh=!record.includes(question);if(fresh)record.push(question);
    const gain=fresh?12+Math.min((profile.streak-1)*2,8):3;profile.xp+=gain;
    if(profile.streak===5)unlock('streak5');if(level==='fundamental'&&record.length>=3)unlock('academyFundamental');if(crown(level)==='gold')unlock('goldStudy');if(allGolden())unlock('academyPolymath');save();return gain;
  };
  const showFeedback=(correct,gain)=>{
    const t=copy(),item=bank(level)[question],panel=document.querySelector('[data-study-feedback]');panel.hidden=false;panel.querySelector('[data-study-feedback-title]').textContent=correct?t.correct+' +'+gain+' XP':t.incorrect;panel.querySelector('[data-study-feedback-copy]').textContent=item.explain;panel.querySelector('[data-study-source]').href=item.source;
  };
  const finishStudy=(correct,selectedIndex)=>{
    if(answered)return;answered=true;const item=bank(level)[question],gain=awardStudy(correct)||0;
    document.querySelectorAll('.study-answer').forEach(button=>{const index=Number(button.dataset.answerIndex);button.disabled=true;if(item.mode==='sequence'){const position=sequenceSelected.indexOf(index);button.classList.toggle('correct',correct||position===index);button.classList.toggle('wrong',!correct&&position!==index);}else{button.classList.toggle('correct',index===item.correct);button.classList.toggle('wrong',index===selectedIndex&&!correct);}});
    showFeedback(correct,gain);
  };
  const chooseSequence=(index,button)=>{
    if(answered||sequenceSelected.includes(index))return;sequenceSelected.push(index);button.classList.add('selected');button.dataset.order=String(sequenceSelected.length);
    const item=bank(level)[question];if(sequenceSelected.length===item.sequence.length){finishStudy(sequenceSelected.every((value,position)=>value===position),index);}
  };
  const nextStudy=()=>{question=(question+1)%bank(level).length;renderQuestion();};
  const renderStars=(interactive=false)=>{
    const svg=document.querySelector('[data-builder-svg]'),map=maps[constellIndex];svg.innerHTML='';
    builtEdges.forEach(edge=>{const a=edge[0],b=edge[1],pa=map.points[a],pb=map.points[b],line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('x1',pa[0]);line.setAttribute('y1',pa[1]);line.setAttribute('x2',pb[0]);line.setAttribute('y2',pb[1]);line.setAttribute('class','line');svg.append(line);});
    map.points.forEach((point,index)=>{const star=document.createElementNS('http://www.w3.org/2000/svg','circle');star.setAttribute('cx',point[0]);star.setAttribute('cy',point[1]);star.setAttribute('r',index===selectedStar?9:7);star.setAttribute('class','star '+(index===selectedStar?'active':''));if(interactive)star.addEventListener('click',()=>pickStar(index));svg.append(star);});
  };
  const firstIncomplete=()=>{const index=maps.findIndex(map=>!profile.constellations.includes(map.id));return index<0?0:index;};
  const showLab=()=>{home.hidden=true;quiz.hidden=true;lab.hidden=false;constellIndex=firstIncomplete();showConstellation();};
  const showConstellation=()=>{
    const t=copy(),map=maps[constellIndex],count=profile.constellations.length>=6?4:3,choices=[mapTitle(map),...maps.filter(item=>item.id!==map.id).sort(()=>Math.random()-.5).slice(0,count-1).map(mapTitle)].sort(()=>Math.random()-.5),answers=document.querySelector('[data-constellation-answers]'),done=profile.constellations.length;
    selectedStar=null;builtEdges=[];document.querySelector('[data-constellation-progress]').textContent=done+'/'+maps.length+' · '+Math.max(maps.length-done,0)+' '+t.mapsLeftLabel;document.querySelector('[data-constellation-dialogue]').textContent=done===maps.length?t.constellationCompleteAll:t.constellationDialogues[constellIndex%t.constellationDialogues.length];document.querySelector('[data-constellation-question]').textContent=t.selectConstellation;document.querySelector('[data-constellation-copy]').textContent=t.selectStars;document.querySelector('[data-builder-status]').textContent='';document.querySelector('[data-next-constellation]').hidden=true;document.querySelector('[data-builder]').hidden=false;renderStars(false);answers.innerHTML='';
    choices.forEach(name=>{const button=document.createElement('button');button.type='button';button.className='constellation-answer';button.textContent=name;button.addEventListener('click',()=>chooseConstellation(button,name===mapTitle(map)));answers.append(button);});
  };
  const chooseConstellation=(button,correct)=>{if(!correct){button.classList.add('wrong');return;}document.querySelectorAll('.constellation-answer').forEach(item=>item.disabled=true);button.classList.add('correct');document.querySelector('[data-constellation-copy]').textContent=copy().buildConstellation;renderStars(true);};
  const completeMap=()=>{const map=maps[constellIndex];if(profile.constellations.includes(map.id))return;profile.constellations.push(map.id);profile.xp+=18;if(profile.constellations.length>=5)unlock('constellation5');if(profile.constellations.length===maps.length)unlock('allConstellations');save();};
  const pickStar=index=>{
    const t=copy(),map=maps[constellIndex],status=document.querySelector('[data-builder-status]');if(selectedStar===null){selectedStar=index;renderStars(true);return;}if(selectedStar===index){selectedStar=null;renderStars(true);return;}
    const pair=[selectedStar,index],expected=map.edges.some(edge=>edgeKey(edge)===edgeKey(pair)),already=builtEdges.some(edge=>edgeKey(edge)===edgeKey(pair));if(expected&&!already){builtEdges.push(pair);status.textContent=builtEdges.length+' / '+map.edges.length;status.classList.remove('error');}else{status.textContent=t.wrongConnection;status.classList.add('error');}selectedStar=null;renderStars(true);
    if(builtEdges.length===map.edges.length){completeMap();status.textContent=t.mapComplete;status.classList.remove('error');document.querySelector('[data-next-constellation]').hidden=false;}
  };
  const nextConstellation=()=>{const start=constellIndex;do{constellIndex=(constellIndex+1)%maps.length;if(!profile.constellations.includes(maps[constellIndex].id))break;}while(constellIndex!==start);showConstellation();};
  const renderAchievements=()=>{
    if(!codex)return;const t=copy(),items=achievements(),cards=document.querySelector('[data-menu-achievements]'),summary=document.querySelector('[data-achievement-summary]'),total=(t.achievementOrder||[]).length;summary.textContent=items.length+' / '+total+' · '+t.achievementsCollected;
    cards.innerHTML=(t.achievementOrder||[]).map(id=>{const meta=t.achievementList[id],earned=items.includes(id);return '<article class="achievement-card '+(earned?'earned':'')+'"><span>'+(earned?'★':'◇')+'</span><div><b>'+meta.title+'</b><small>'+meta.copy+'</small></div><em>'+(earned?t.earned:t.locked)+'</em></article>';}).join('');
  };
  const openAchievements=()=>{menu.hidden=true;codex.hidden=false;renderAchievements();};
  const closeAchievements=()=>{codex.hidden=true;menu.hidden=false;menu.style.display='flex';};
  document.querySelector('[data-action="academy"]').addEventListener('click',open);document.querySelector('[data-action="achievements"]').addEventListener('click',openAchievements);document.querySelector('[data-close-academy]').addEventListener('click',close);document.querySelector('[data-close-menu-achievements]').addEventListener('click',closeAchievements);
  document.querySelectorAll('[data-back-academy]').forEach(button=>button.addEventListener('click',()=>{home.hidden=false;quiz.hidden=true;lab.hidden=true;renderHome();}));document.querySelector('[data-open-constellations]').addEventListener('click',showLab);document.querySelector('[data-study-next]').addEventListener('click',nextStudy);document.querySelector('[data-next-constellation]').addEventListener('click',nextConstellation);
  document.querySelector('[data-profile-name]').addEventListener('input',event=>{profile.name=event.target.value.trim();save();});document.querySelectorAll('[data-avatar]').forEach(button=>button.addEventListener('click',()=>{profile.avatar=button.dataset.avatar;save();renderProfile();}));
  window.renderAcademy=renderHome;window.renderMenuAchievements=renderAchievements;
})();
