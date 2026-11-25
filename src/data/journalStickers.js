import { SITE_BASE } from './siteBase.js';
/** 每张贴纸均是独立 PNG 或 SVG；可自由拖动、缩放、换层与移除。 */
const make=(id,name,category,ratio=1)=>({id,name,category,ratio,src:`${SITE_BASE}images/stickers/${id}.${id.startsWith('watercolor-')?'png':'svg'}`});
const defs=[
  ['tape-kraft','牛皮点点胶带','tape',3.5],['tape-blue','雾蓝格纹胶带','tape',3.5],
  ['tape-sage','鼠尾草胶带','tape',3.5],['tape-pink','小花粉胶带','tape',3.5],
  ['tape-cream','奶油手绘胶带','tape',3.5],['tape-check','中古格纹胶带','tape',3.5],
  ['paper-ivory','撕边奶油纸','paper',1.33],['paper-blue','海盐方格纸','paper',1.33],
  ['paper-peach','杏粉手记纸','paper',1.33],['paper-sage','绿色横线纸','paper',1.33],
  ['paper-grid','复古网格纸','paper',1.33],
  ['label-travel','TRAVEL NOTES','paper',3.4],['label-sun','SUNNY DAY','paper',3.4],
  ['label-memo','MEMORIES','paper',3.4],['label-happy','GOOD DAY','paper',3.4],
  ['label-ticket','票根标签','paper',3.4],['label-moment','little moments','paper',3.4],
  ['stamp-postmark','旅行纪念邮戳','travel',1],['stamp-date','复古日期章','travel',1],
  ['doodle-map-pin','手绘定位','travel',1],['doodle-mountain','远山','travel',1],
  ['doodle-camera','复古相机','travel',1],['doodle-coffee','旅途咖啡','travel',1],
  ['doodle-plane','小飞机','travel',1],['doodle-suitcase','小行李箱','travel',1],
  ['doodle-shell','海边贝壳','nature',1],['doodle-wave','海浪线','nature',1],
  ['doodle-plant','植物枝叶','nature',1],['doodle-flower','野花','nature',1],
  ['doodle-arrow','手绘弯箭头','doodle',1],['doodle-heart','粉色手绘爱心','doodle',1],
  ['doodle-sparkles','星光','doodle',1],['doodle-checklist','旅行小清单','doodle',1],
  ['doodle-star','暖黄星星','doodle',1],['doodle-ribbon','SMILE 缎带','doodle',1],
  ['frame-polaroid','拍立得相纸','frame',.9],['frame-film','黑色胶片框','frame',1.3],
  ['frame-postcard','明信片框','frame',1.4],['frame-torn','不规则撕纸框','frame',1.2]
];
export const STICKER_CATEGORIES=[
  {id:'all',name:'全部'}, {id:'tape',name:'纸胶带'},
  {id:'paper',name:'便签纸片'}, {id:'travel',name:'旅行物件'},
  {id:'nature',name:'花草海岛'}, {id:'doodle',name:'手写涂鸦'},
  {id:'frame',name:'票据相框'}, {id:'watercolor',name:'水彩贴纸'}
];
const watercolorNames=["淡粉野花束", "暖黄花枝", "鼠尾草枝叶", "奶油阳光花", "草莓点心", "手绘贝壳", "旅行木船", "复古相机", "旅行手提箱", "蓝白格胶带", "小岛贝壳章", "随心咖啡", "花朵邮票", "午后叶片", "小花船票", "可爱小花瓶", "海风粉色花簇", "海盐蓝野花", "奶油野花束", "雾绿藤枝", "夏日贝壳", "玻璃漂流瓶", "小鱼与海草", "纸片定位标", "手作车票", "可爱手账相机", "蓝色旅行邮票", "明信片小邮戳", "午后咖啡杯", "野餐柠檬片", "旅行彩色小旗", "蜡笔爱心"];
const watercolors=watercolorNames.map((name,i)=>make(`watercolor-${String(i+1).padStart(2,'0')}`,name,'watercolor',1));
export const JOURNAL_STICKERS=[...defs.map(d=>make(...d)),...watercolors];
const byId=new Map(JOURNAL_STICKERS.map(x=>[x.id,x]));
const legacy={flower:'doodle-flower',sun:'doodle-star',leaf:'doodle-plant',sparkle:'doodle-sparkles',stamp:'stamp-postmark'};
export const getJournalSticker=id=>byId.get(legacy[id]||id)||byId.get('doodle-flower');
export const stickersForCategory=id=>id==='all'?JOURNAL_STICKERS:JOURNAL_STICKERS.filter(x=>x.category===id);
