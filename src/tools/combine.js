/*
 * 弹幕合并
 * 该模块使用了pakku.js v10.1.1的源代码并进行二次开发，使用GPL-3.0协议授权
 * 原仓库：https://github.com/xmcp/pakku.js
 */

const config = require('../../config');

// 谐音字典
const PINYIN_DICT_RAW={
"a":"啊阿锕",
"ai":"埃挨哎唉哀皑癌蔼矮艾碍爱隘诶捱嗳嗌嫒瑷暧砹锿霭",
"an":"鞍氨安俺按暗岸胺案谙埯揞犴庵桉铵鹌顸黯",
"ang":"肮昂盎",
"ao":"凹敖熬翱袄傲奥懊澳坳拗嗷噢岙廒遨媪骜聱螯鏊鳌鏖",
"b-a":"芭捌扒叭吧笆八疤巴拔跋靶把耙坝霸罢爸茇菝萆捭岜灞杷钯粑鲅魃",
"b-ai":"白柏百摆佰败拜稗薜掰鞴",
"b-an":"斑班搬扳般颁板版扮拌伴瓣半办绊阪坂豳钣瘢癍舨",
"b-ang":"邦帮梆榜膀绑棒磅蚌镑傍谤蒡螃",
"b-ao":"苞胞包褒雹保堡饱宝抱报暴豹鲍爆勹葆宀孢煲鸨褓趵龅",
"b-uo":"剥薄玻菠播拨钵波博勃搏铂箔伯帛舶脖膊渤泊驳亳蕃啵饽檗擘礴钹鹁簸跛",
"b-ei":"杯碑悲卑北辈背贝钡倍狈备惫焙被孛陂邶埤蓓呗怫悖碚鹎褙鐾",
"b-en":"奔苯本笨畚坌锛",
"b-eng":"崩绷甭泵蹦迸唪嘣甏",
"b-ee":"逼鼻比鄙笔彼碧蓖蔽毕毙毖币庇痹闭敝弊必辟壁臂避陛匕仳俾芘荜荸吡哔狴庳愎滗濞弼妣婢嬖璧贲畀铋秕裨筚箅篦舭襞跸髀",
"b-ian":"鞭边编贬扁便变卞辨辩辫遍匾弁苄忭汴缏煸砭碥稹窆蝙笾鳊",
"b-iao":"标彪膘表婊骠飑飙飚灬镖镳瘭裱鳔",
"b-ie":"鳖憋别瘪蹩鳘",
"b-in":"彬斌濒滨宾摈傧浜缤玢殡膑镔髌鬓",
"b-ing":"兵冰柄丙秉饼炳病并禀邴摒绠枋槟燹",
"b-u":"捕卜哺补埠不布步簿部怖拊卟逋瓿晡钚醭",
"c-a":"擦嚓礤",
"c-ai":"猜裁材才财睬踩采彩菜蔡",
"c-an":"餐参蚕残惭惨灿骖璨粲黪",
"c-ang":"苍舱仓沧藏伧",
"c-ao":"操糙槽曹草艹嘈漕螬艚",
"c-e":"厕策侧册测刂帻恻",
"c-eng":"层蹭噌",
"ch-a":"插叉茬茶查碴搽察岔差诧猹馇汊姹杈楂槎檫钗锸镲衩",
"ch-ai":"拆柴豺侪茈瘥虿龇",
"ch-an":"搀掺蝉馋谗缠铲产阐颤冁谄谶蒇廛忏潺澶孱羼婵嬗骣觇禅镡裣蟾躔",
"ch-ang":"昌猖场尝常长偿肠厂敞畅唱倡伥鬯苌菖徜怅惝阊娼嫦昶氅鲳",
"ch-ao":"超抄钞朝嘲潮巢吵炒怊绉晁耖",
"ch-e":"车扯撤掣彻澈坼屮砗",
"ch-en":"郴臣辰尘晨忱沉陈趁衬称谌抻嗔宸琛榇肜胂碜龀",
"ch-eng":"撑城橙成呈乘程惩澄诚承逞骋秤埕嵊徵浈枨柽樘晟塍瞠铖裎蛏酲",
"ch-i":"吃痴持匙池迟弛驰耻齿侈尺赤翅斥炽傺墀芪茌搋叱哧啻嗤彳饬沲媸敕胝眙眵鸱瘛褫蚩螭笞篪豉踅踟魑",
"ch-ong":"充冲虫崇宠茺忡憧铳艟",
"ch-ou":"抽酬畴踌稠愁筹仇绸瞅丑俦圳帱惆溴妯瘳雠鲋",
"ch-u":"臭初出橱厨躇锄雏滁除楚础储矗搐触处亍刍憷绌杵楮樗蜍蹰黜",
"ch-uan":"揣川穿椽传船喘串掾舛惴遄巛氚钏镩舡",
"ch-uang":"疮窗幢床闯创怆",
"ch-ui":"吹炊捶锤垂陲棰槌",
"ch-un":"春椿醇唇淳纯蠢促莼沌肫朐鹑蝽",
"ch-uo":"戳绰蔟辶辍镞踔龊",
"c-i":"疵茨磁雌辞慈瓷词此刺赐次荠呲嵯鹚螅糍趑",
"c-ong":"聪葱囱匆从丛偬苁淙骢琮璁枞",
"c-u":"凑粗醋簇猝殂蹙",
"c-uan":"蹿篡窜汆撺昕爨",
"c-ui":"摧崔催脆瘁粹淬翠萃悴璀榱隹",
"c-un":"村存寸磋忖皴",
"c-uo":"撮搓措挫错厝脞锉矬痤鹾蹉躜",
"d-a":"搭达答瘩打大耷哒嗒怛妲疸褡笪靼鞑",
"d-ai":"呆歹傣戴带殆代贷袋待逮怠埭甙呔岱迨逯骀绐玳黛",
"d-an":"耽担丹单郸掸胆旦氮但惮淡诞弹蛋亻儋卩萏啖澹檐殚赕眈瘅聃箪",
"d-ang":"当挡党荡档谠凼菪宕砀铛裆",
"d-ao":"刀捣蹈倒岛祷导到稻悼道盗叨啁忉洮氘焘忑纛",
"d-e":"德得的锝",
"d-eng":"蹬灯登等瞪凳邓噔嶝戥磴镫簦",
"d-ee":"堤低滴迪敌笛狄涤翟嫡抵底地蒂第帝弟递缔氐籴诋谛邸坻莜荻嘀娣柢棣觌砥碲睇镝羝骶",
"d-ian":"颠掂滇碘点典靛垫电佃甸店惦奠淀殿丶阽坫埝巅玷癜癫簟踮",
"d-iao":"碉叼雕凋刁掉吊钓调轺铞蜩粜貂",
"d-ie":"跌爹碟蝶迭谍叠佚垤堞揲喋渫轶牒瓞褶耋蹀鲽鳎",
"d-ing":"丁盯叮钉顶鼎锭定订丢仃啶玎腚碇町铤疔耵酊",
"d-ong":"东冬董懂动栋侗恫冻洞垌咚岽峒夂氡胨胴硐鸫",
"d-ou":"兜抖斗陡豆逗痘蔸钭窦窬蚪篼酡",
"d-u":"都督毒犊独读堵睹赌杜镀肚度渡妒芏嘟渎椟橐牍蠹笃髑黩",
"d-uan":"端短锻段断缎彖椴煅簖",
"d-ui":"堆兑队对怼憝碓",
"d-un":"墩吨蹲敦顿囤钝盾遁炖砘礅盹镦趸",
"d-uo":"掇哆多夺垛躲朵跺舵剁惰堕咄哚缍柁铎裰踱",
"e":"蛾峨鹅俄额讹娥恶厄扼遏鄂饿噩谔垩垭苊莪萼呃愕屙婀轭曷腭硪锇锷鹗颚鳄",
"en":"恩蒽摁唔嗯",
"er":"而儿耳尔饵洱二贰迩珥铒鸸鲕",
"f-a":"发罚筏伐乏阀法珐垡砝",
"f-an":"藩帆番翻樊矾钒繁凡烦反返范贩犯饭泛蘩幡犭梵攵燔畈蹯",
"f-ang":"坊芳方肪房防妨仿访纺放匚邡彷钫舫鲂",
"f-ei":"菲非啡飞肥匪诽吠肺废沸费芾狒悱淝妃绋绯榧腓斐扉祓砩镄痱蜚篚翡霏鲱",
"f-en":"芬酚吩氛分纷坟焚汾粉奋份忿愤粪偾瀵棼愍鲼鼢",
"f-eng":"丰封枫蜂峰锋风疯烽逢冯缝讽奉凤俸酆葑沣砜",
"f-u":"佛否夫敷肤孵扶拂辐幅氟符伏俘服浮涪福袱弗甫抚辅俯釜斧脯腑府腐赴副覆赋复傅付阜父腹负富讣附妇缚咐匐凫郛芙苻茯莩菔呋幞滏艴孚驸绂桴赙黻黼罘稃馥虍蚨蜉蝠蝮麸趺跗鳆",
"g-a":"噶嘎蛤尬呷尕尜旮钆",
"g-ai":"该改概钙盖溉丐陔垓戤赅胲",
"g-an":"干甘杆柑竿肝赶感秆敢赣坩苷尴擀泔淦澉绀橄旰矸疳酐",
"g-ang":"冈刚钢缸肛纲岗港戆罡颃筻",
"g-ong":"杠工攻功恭龚供躬公宫弓巩汞拱贡共蕻廾咣珙肱蚣蛩觥",
"g-ao":"篙皋高膏羔糕搞镐稿告睾诰郜蒿藁缟槔槁杲锆",
"g-e":"哥歌搁戈鸽胳疙割革葛格阁隔铬个各鬲仡哿塥嗝纥搿膈硌铪镉袼颌虼舸骼髂",
"g-ei":"给",
"g-en":"根跟亘茛哏艮",
"g-eng":"耕更庚羹埂耿梗哽赓鲠",
"g-ou":"钩勾沟苟狗垢构购够佝诟岣遘媾缑觏彀鸲笱篝鞲",
"g-u":"辜菇咕箍估沽孤姑鼓古蛊骨谷股故顾固雇嘏诂菰哌崮汩梏轱牯牿胍臌毂瞽罟钴锢瓠鸪鹄痼蛄酤觚鲴骰鹘",
"g-ua":"刮瓜剐寡挂褂卦诖呱栝鸹",
"g-uai":"乖拐怪哙",
"g-uan":"棺关官冠观管馆罐惯灌贯倌莞掼涫盥鹳鳏",
"g-uang":"光广逛犷桄胱疒",
"g-ui":"瑰规圭硅归龟闺轨鬼诡癸桂柜跪贵刽匦刿庋宄妫桧炅晷皈簋鲑鳜",
"g-un":"辊滚棍丨衮绲磙鲧",
"g-uo":"锅郭国果裹过馘蠃埚掴呙囗帼崞猓椁虢锞聒蜮蜾蝈",
"h-a":"哈",
"h-ai":"骸孩海氦亥害骇咴嗨颏醢",
"h-an":"酣憨邯韩含涵寒函喊罕翰撼捍旱憾悍焊汗汉邗菡撖阚瀚晗焓颔蚶鼾",
"h-en":"夯痕很狠恨",
"h-ang":"杭航沆绗珩桁",
"h-ao":"壕嚎豪毫郝好耗号浩薅嗥嚆濠灏昊皓颢蚝",
"h-e":"呵喝荷菏核禾和何合盒貉阂河涸赫褐鹤贺诃劾壑藿嗑嗬阖盍蚵翮",
"h-ei":"嘿黑",
"h-eng":"哼亨横衡恒訇蘅",
"h-ong":"轰哄烘虹鸿洪宏弘红黉讧荭薨闳泓",
"h-ou":"喉侯猴吼厚候后堠後逅瘊篌糇鲎骺",
"h-u":"呼乎忽瑚壶葫胡蝴狐糊湖弧虎唬护互沪户冱唿囫岵猢怙惚浒滹琥槲轷觳烀煳戽扈祜鹕鹱笏醐斛",
"h-ua":"花哗华猾滑画划化话劐浍骅桦铧稞",
"h-uai":"槐徊怀淮坏还踝",
"h-uan":"欢环桓缓换患唤痪豢焕涣宦幻郇奂垸擐圜洹浣漶寰逭缳锾鲩鬟",
"h-uang":"荒慌黄磺蝗簧皇凰惶煌晃幌恍谎隍徨湟潢遑璜肓癀蟥篁鳇",
"h-ui":"灰挥辉徽恢蛔回毁悔慧卉惠晦贿秽会烩汇讳诲绘诙茴荟蕙哕喙隳洄彗缋珲晖恚虺蟪麾",
"h-un":"荤昏婚魂浑混诨馄阍溷缗",
"h-uo":"豁活伙火获或惑霍货祸攉嚯夥钬锪镬耠蠖",
"j-ee":"击圾基机畸稽积箕肌饥迹激讥鸡姬绩缉吉极棘辑籍集及急疾汲即嫉级挤几脊己蓟技冀季伎祭剂悸济寄寂计记既忌际妓继纪居丌乩剞佶佴脔墼芨芰萁蒺蕺掎叽咭哜唧岌嵴洎彐屐骥畿玑楫殛戟戢赍觊犄齑矶羁嵇稷瘠瘵虮笈笄暨跻跽霁鲚鲫髻麂",
"j-ia":"嘉枷夹佳家加荚颊贾甲钾假稼价架驾嫁伽郏拮岬浃迦珈戛胛恝铗镓痂蛱笳袈跏",
"j-ian":"歼监坚尖笺间煎兼肩艰奸缄茧检柬碱硷拣捡简俭剪减荐槛鉴践贱见键箭件健舰剑饯渐溅涧建僭谏谫菅蒹搛囝湔蹇謇缣枧柙楗戋戬牮犍毽腱睑锏鹣裥笕箴翦趼踺鲣鞯",
"j-iang":"僵姜将浆江疆蒋桨奖讲匠酱降茳洚绛缰犟礓耩糨豇",
"j-iao":"蕉椒礁焦胶交郊浇骄娇嚼搅铰矫侥脚狡角饺缴绞剿教酵轿较叫佼僬茭挢噍峤徼姣纟敫皎鹪蛟醮跤鲛",
"j-ie":"窖揭接皆秸街阶截劫节桔杰捷睫竭洁结解姐戒藉芥界借介疥诫届偈讦诘喈嗟獬婕孑桀獒碣锴疖袷颉蚧羯鲒骱髫",
"j-in":"巾筋斤金今津襟紧锦仅谨进靳晋禁近烬浸尽卺荩堇噤馑廑妗缙瑾槿赆觐钅锓衿矜",
"j-ing":"劲荆兢茎睛晶鲸京惊精粳经井警景颈静境敬镜径痉靖竟竞净刭儆阱菁獍憬泾迳弪婧肼胫腈旌",
"j-iong":"炯窘冂迥扃",
"j-iu":"揪究纠玖韭久灸九酒厩救旧臼舅咎就疚僦啾阄柩桕鹫赳鬏",
"j-v":"鞠拘狙疽驹菊局咀矩举沮聚拒据巨具距踞锯俱句惧炬剧倨讵苣苴莒掬遽屦琚枸椐榘榉橘犋飓钜锔窭裾趄醵踽龃雎鞫",
"j-van":"捐鹃娟倦眷卷绢鄄狷涓桊蠲锩镌隽",
"j-ve":"撅攫抉掘倔爵觉决诀绝厥劂谲矍蕨噘崛獗孓珏桷橛爝镢蹶觖",
"j-vn":"均菌钧军君峻俊竣浚郡骏捃狻皲筠麇",
"k-a":"喀咖卡佧咔胩",
"k-e":"咯坷苛柯棵磕颗科壳咳可渴克刻客课岢恪溘骒缂珂轲氪瞌钶疴窠蝌髁",
"k-ai":"开揩楷凯慨剀垲蒈忾恺铠锎",
"k-an":"刊堪勘坎砍看侃凵莰莶戡龛瞰",
"k-ang":"康慷糠扛抗亢炕坑伉闶钪",
"k-ao":"考拷烤靠尻栲犒铐",
"k-en":"肯啃垦恳垠裉颀",
"k-eng":"吭忐铿",
"k-ong":"空恐孔控倥崆箜",
"k-ou":"抠口扣寇芤蔻叩眍筘",
"k-u":"枯哭窟苦酷库裤刳堀喾绔骷",
"k-ua":"夸垮挎跨胯侉",
"k-uai":"块筷侩快蒯郐蒉狯脍",
"k-uan":"宽款髋",
"k-uang":"匡筐狂框矿眶旷况诓诳邝圹夼哐纩贶",
"k-ui":"亏盔岿窥葵奎魁傀馈愧溃馗匮夔隗揆喹喟悝愦阕逵暌睽聩蝰篑臾跬",
"k-un":"坤昆捆困悃阃琨锟醌鲲髡",
"k-uo":"括扩廓阔蛞",
"l-a":"垃拉喇蜡腊辣啦剌摺邋旯砬瘌",
"l-ai":"莱来赖崃徕涞濑赉睐铼癞籁",
"l-an":"蓝婪栏拦篮阑兰澜谰揽览懒缆烂滥啉岚懔漤榄斓罱镧褴",
"l-ang":"琅榔狼廊郎朗浪莨蒗啷阆锒稂螂",
"l-ao":"捞劳牢老佬姥酪烙涝唠崂栳铑铹痨醪",
"l-e":"勒乐肋仂叻嘞泐鳓",
"l-ei":"雷镭蕾磊累儡垒擂类泪羸诔荽咧漯嫘缧檑耒酹",
"l-ing":"棱冷拎玲菱零龄铃伶羚凌灵陵岭领另令酃塄苓呤囹泠绫柃棂瓴聆蛉翎鲮",
"l-eng":"楞愣",
"l-ee":"厘梨犁黎篱狸离漓理李里鲤礼莉荔吏栗丽厉励砾历利傈例俐痢立粒沥隶力璃哩俪俚郦坜苈莅蓠藜捩呖唳喱猁溧澧逦娌嫠骊缡珞枥栎轹戾砺詈罹锂鹂疠疬蛎蜊蠡笠篥粝醴跞雳鲡鳢黧",
"l-ian":"俩联莲连镰廉怜涟帘敛脸链恋炼练挛蔹奁潋濂娈琏楝殓臁膦裢蠊鲢",
"l-iang":"粮凉梁粱良两辆量晾亮谅墚椋踉靓魉",
"l-iao":"撩聊僚疗燎寥辽潦了撂镣廖料蓼尥嘹獠寮缭钌鹩耢",
"l-ie":"列裂烈劣猎冽埒洌趔躐鬣",
"l-in":"琳林磷霖临邻鳞淋凛赁吝蔺嶙廪遴檩辚瞵粼躏麟",
"l-iu":"溜琉榴硫馏留刘瘤流柳六抡偻蒌泖浏遛骝绺旒熘锍镏鹨鎏",
"l-ong":"龙聋咙笼窿隆垄拢陇弄垅茏泷珑栊胧砻癃",
"l-ou":"楼娄搂篓漏陋喽嵝镂瘘耧蝼髅",
"l-u":"芦卢颅庐炉掳卤虏鲁麓碌露路赂鹿潞禄录陆戮垆摅撸噜泸渌漉璐栌橹轳辂辘氇胪镥鸬鹭簏舻鲈",
"l-v":"驴吕铝侣旅履屡缕虑氯律率滤绿捋闾榈膂稆褛",
"l-uan":"峦孪滦卵乱栾鸾銮",
"l-ve":"掠略锊",
"l-un":"轮伦仑沦纶论囵",
"l-uo":"萝螺罗逻锣箩骡裸落洛骆络倮荦摞猡泺椤脶镙瘰雒",
"m-a":"妈麻玛码蚂马骂嘛吗唛犸嬷杩麽",
"m-ai":"埋买麦卖迈脉劢荬咪霾",
"m-an":"瞒馒蛮满蔓曼慢漫谩墁幔缦熳镘颟螨鳗鞔",
"m-ang":"芒茫盲忙莽邙漭朦硭蟒",
"m-eng":"氓萌蒙檬盟锰猛梦孟勐甍瞢懵礞虻蜢蠓艋艨黾",
"m-iao":"猫苗描瞄藐秒渺庙妙喵邈缈缪杪淼眇鹋蜱",
"m-ao":"茅锚毛矛铆卯茂冒帽貌贸侔袤勖茆峁瑁昴牦耄旄懋瞀蛑蝥蟊髦",
"m-e":"么",
"m-ei":"玫枚梅酶霉煤没眉媒镁每美昧寐妹媚坶莓嵋猸浼湄楣镅鹛袂魅",
"m-en":"门闷们扪玟焖懑钔",
"m-ee":"眯醚靡糜迷谜弥米秘觅泌蜜密幂芈冖谧蘼嘧猕獯汨宓弭脒敉糸縻麋",
"m-ian":"棉眠绵冕免勉娩缅面沔湎腼眄",
"m-ie":"蔑灭咩蠛篾",
"m-in":"民抿皿敏悯闽苠岷闵泯珉",
"m-ing":"明螟鸣铭名命冥茗溟暝瞑酩",
"m-iu":"谬",
"m-uo":"摸摹蘑模膜磨摩魔抹末莫墨默沫漠寞陌谟茉蓦馍嫫镆秣瘼耱蟆貊貘",
"m-ou":"谋牟某厶哞婺眸鍪",
"m-u":"拇牡亩姆母墓暮幕募慕木目睦牧穆仫苜呒沐毪钼",
"n-a":"拿哪呐钠那娜纳内捺肭镎衲箬",
"n-ai":"氖乃奶耐奈鼐艿萘柰",
"n-an":"南男难囊喃囡楠腩蝻赧",
"n-ao":"挠脑恼闹孬垴猱瑙硇铙蛲",
"n-e":"淖呢讷",
"n-ei":"馁",
"n-en":"嫩能枘恁",
"n-ee":"妮霓倪泥尼拟你匿腻逆溺伲坭猊怩滠昵旎祢慝睨铌鲵",
"n-ian":"蔫拈年碾撵捻念廿辇黏鲇鲶",
"n-iang":"娘酿",
"n-iao":"鸟尿茑嬲脲袅",
"n-ie":"捏聂孽啮镊镍涅乜陧蘖嗫肀颞臬蹑",
"n-in":"您柠",
"n-ing":"狞凝宁拧泞佞蓥咛甯聍",
"n-iu":"牛扭钮纽狃忸妞蚴",
"n-ong":"脓浓农侬",
"n-u":"奴努怒呶帑弩胬孥驽",
"n-v":"女恧钕衄",
"n-uan":"暖",
"n-ve":"虐疟",
"n-uo":"挪懦糯诺傩搦喏锘",
"ou":"哦欧鸥殴藕呕偶沤怄瓯耦",
"p-a":"啪趴爬帕怕琶葩筢",
"p-ai":"拍排牌徘湃派俳蒎",
"p-an":"攀潘盘磐盼畔判叛爿泮袢襻蟠蹒",
"p-ang":"乓庞旁耪胖滂逄",
"p-ao":"抛咆刨炮袍跑泡匏狍庖脬疱",
"p-ei":"呸胚培裴赔陪配佩沛掊辔帔淠旆锫醅霈",
"p-en":"喷盆湓",
"p-eng":"砰抨烹澎彭蓬棚硼篷膨朋鹏捧碰坯堋嘭怦蟛",
"p-ee":"砒霹批披劈琵毗啤脾疲皮匹痞僻屁譬丕陴邳郫圮鼙擗噼庀媲纰枇甓睥罴铍痦癖疋蚍貔",
"p-ian":"篇偏片骗谝骈犏胼褊翩蹁",
"p-iao":"飘漂瓢票剽嘌嫖缥殍瞟螵",
"p-ie":"撇瞥丿苤氕",
"p-in":"拼频贫品聘拚姘嫔榀牝颦",
"p-ing":"乒坪苹萍平凭瓶评屏俜娉枰鲆",
"p-uo":"坡泼颇婆破魄迫粕叵鄱溥珀钋钷皤笸",
"p-ou":"剖裒踣",
"p-u":"扑铺仆莆葡菩蒲埔朴圃普浦谱曝瀑匍噗濮璞氆镤镨蹼",
"q-ee":"期欺栖戚妻七凄漆柒沏其棋奇歧畦崎脐齐旗祈祁骑起岂乞企启契砌器气迄弃汽泣讫亟亓圻芑萋葺嘁屺岐汔淇骐绮琪琦杞桤槭欹祺憩碛蛴蜞綦綮趿蹊鳍麒",
"q-ia":"掐恰洽葜",
"q-ian":"牵扦钎铅千迁签仟谦乾黔钱钳前潜遣浅谴堑嵌欠歉佥阡芊芡荨掮岍悭慊骞搴褰缱椠肷愆钤虔箝",
"q-iang":"枪呛腔羌墙蔷强抢嫱樯戗炝锖锵镪襁蜣羟跫跄",
"q-iao":"橇锹敲悄桥瞧乔侨巧鞘撬翘峭俏窍劁诮谯荞愀憔缲樵毳硗跷鞒",
"q-ie":"切茄且怯窃郄唼惬妾挈锲箧",
"q-in":"钦侵亲秦琴勤芹擒禽寝沁芩蓁蕲揿吣嗪噙溱檎螓衾",
"q-ing":"青轻氢倾卿清擎晴氰情顷请庆倩苘圊檠磬蜻罄箐謦鲭黥",
"q-iong":"琼穷邛茕穹筇銎",
"q-iu":"秋丘邱球求囚酋泅俅氽巯艽犰湫逑遒楸赇鸠虬蚯蝤裘糗鳅鼽",
"q-v":"趋区蛆曲躯屈驱渠取娶龋趣去诎劬蕖蘧岖衢阒璩觑氍祛磲癯蛐蠼麴瞿黢",
"q-van":"圈颧权醛泉全痊拳犬券劝诠荃獾悛绻辁畎铨蜷筌鬈",
"q-ve":"缺炔瘸却鹊榷确雀阙悫",
"q-vn":"裙群逡",
"r-an":"然燃冉染苒髯",
"r-ang":"瓤壤攘嚷让禳穰",
"r-ao":"饶扰绕荛娆桡",
"r-uo":"惹若弱",
"r-e":"热偌",
"r-en":"壬仁人忍韧任认刃妊纫仞荏葚饪轫稔衽",
"r-eng":"扔仍",
"r-i":"日",
"r-ong":"戎茸蓉荣融熔溶容绒冗嵘狨缛榕蝾",
"r-ou":"揉柔肉糅蹂鞣",
"r-u":"茹蠕儒孺如辱乳汝入褥蓐薷嚅洳溽濡铷襦颥",
"r-uan":"软阮朊",
"r-ui":"蕊瑞锐芮蕤睿蚋",
"r-un":"闰润",
"s-a":"撒洒萨卅仨挲飒",
"s-ai":"腮鳃塞赛噻",
"s-an":"三叁伞散彡馓氵毵糁霰",
"s-ang":"桑嗓丧搡磉颡",
"s-ao":"搔骚扫嫂埽臊瘙鳋",
"s-e":"瑟色涩啬铩铯穑",
"s-en":"森",
"s-eng":"僧",
"sh-a":"莎砂杀刹沙纱傻啥煞脎歃痧裟霎鲨",
"sh-ai":"筛晒酾",
"sh-an":"珊苫杉山删煽衫闪陕擅赡膳善汕扇缮剡讪鄯埏芟潸姗骟膻钐疝蟮舢跚鳝",
"sh-ang":"墒伤商赏晌上尚裳垧绱殇熵觞",
"sh-ao":"梢捎稍烧芍勺韶少哨邵绍劭苕潲蛸笤筲艄",
"sh-e":"奢赊蛇舌舍赦摄射慑涉社设厍佘猞畲麝",
"sh-en":"砷申呻伸身深娠绅神沈审婶甚肾慎渗诜谂吲哂渖椹矧蜃",
"sh-eng":"声生甥牲升绳省盛剩胜圣丞渑媵眚笙",
"sh-i":"师失狮施湿诗尸虱十石拾时什食蚀实识史矢使屎驶始式示士世柿事拭誓逝势是嗜噬适仕侍释饰氏市恃室视试谥埘莳蓍弑唑饣轼耆贳炻礻铈铊螫舐筮豕鲥鲺",
"sh-ou":"收手首守寿授售受瘦兽扌狩绶艏",
"sh-u":"蔬枢梳殊抒输叔舒淑疏书赎孰熟薯暑曙署蜀黍鼠属术述树束戍竖墅庶数漱恕倏塾菽忄沭涑澍姝纾毹腧殳镯秫鹬",
"sh-ua":"刷耍唰涮",
"sh-uai":"摔衰甩帅蟀",
"sh-uan":"栓拴闩",
"sh-uang":"霜双爽孀",
"sh-ui":"谁水睡税",
"sh-un":"吮瞬顺舜恂",
"sh-uo":"说硕朔烁蒴搠嗍濯妁槊铄",
"s-i":"斯撕嘶思私司丝死肆寺嗣四伺似饲巳厮俟兕菥咝汜泗澌姒驷缌祀祠锶鸶耜蛳笥",
"s-ong":"松耸怂颂送宋讼诵凇菘崧嵩忪悚淞竦",
"s-ou":"搜艘擞嗽叟嗖嗾馊溲飕瞍锼螋",
"s-u":"苏酥俗素速粟僳塑溯宿诉肃夙谡蔌嗉愫簌觫稣",
"s-uan":"酸蒜算",
"s-ui":"虽隋随绥髓碎岁穗遂隧祟蓑冫谇濉邃燧眭睢",
"s-un":"孙损笋荪狲飧榫跣隼",
"s-uo":"梭唆缩琐索锁所唢嗦娑桫睃羧",
"t-a":"塌他它她塔獭挞蹋踏闼溻遢榻沓",
"t-ai":"胎苔抬台泰酞太态汰邰薹肽炱钛跆鲐",
"t-an":"坍摊贪瘫滩坛檀痰潭谭谈坦毯袒碳探叹炭郯蕈昙钽锬覃",
"t-ang":"汤塘搪堂棠膛唐糖傥饧溏瑭铴镗耥螗螳羰醣倘躺淌趟烫",
"t-ao":"掏涛滔绦萄桃逃淘陶讨套挑鼗啕韬饕",
"t-e":"特",
"t-eng":"藤腾疼誊滕",
"t-ee":"梯剔踢锑提题蹄啼体替嚏惕涕剃屉荑悌逖绨缇鹈裼醍",
"t-ian":"天添填田甜恬舔腆掭忝阗殄畋钿蚺",
"t-iao":"条迢眺跳佻祧铫窕龆鲦",
"t-ie":"贴铁帖萜餮",
"t-ing":"厅听烃汀廷停亭庭挺艇莛葶婷梃蜓霆",
"t-ong":"通桐酮瞳同铜彤童桶捅筒统痛佟僮仝茼嗵恸潼砼",
"t-ou":"偷投头透亠",
"t-u":"凸秃突图徒途涂屠土吐兔堍荼菟钍酴",
"t-uan":"湍团疃",
"t-ui":"推颓腿蜕褪退忒煺",
"t-un":"吞屯臀饨暾豚窀",
"t-uo":"拖托脱鸵陀驮驼椭妥拓唾乇佗坨庹沱柝砣箨舄跎鼍",
"w-a":"挖哇蛙洼娃瓦袜佤娲腽",
"w-ai":"歪外",
"w-an":"豌弯湾玩顽丸烷完碗挽晚皖惋宛婉万腕剜芄苋菀纨绾琬脘畹蜿箢",
"w-ang":"汪王亡枉网往旺望忘妄罔尢惘辋魍",
"w-ei":"威巍微危韦违桅围唯惟为潍维苇萎委伟伪尾纬未蔚味畏胃喂魏位渭谓尉慰卫倭偎诿隈葳薇帏帷崴嵬猥猬闱沩洧涠逶娓玮韪軎炜煨熨痿艉鲔",
"w-en":"瘟温蚊文闻纹吻稳紊问刎愠阌汶璺韫殁雯",
"w-eng":"嗡翁瓮蓊蕹",
"w-o":"挝蜗涡窝我斡卧握沃莴幄渥杌肟龌",
"w-u":"巫呜钨乌污诬屋无芜梧吾吴毋武五捂午舞伍侮坞戊雾晤物勿务悟误兀仵阢邬圬芴庑怃忤浯寤迕妩骛牾焐鹉鹜蜈鋈鼯",
"x-ee":"昔熙析西硒矽晰嘻吸锡牺稀息希悉膝夕惜熄烯溪汐犀檄袭席习媳喜铣洗系隙戏细僖兮隰郗茜葸蓰奚唏徙饩阋浠淅屣嬉玺樨曦觋欷熹禊禧钸皙穸蜥蟋舾羲粞翕醯鼷",
"x-ia":"瞎虾匣霞辖暇峡侠狭下厦夏吓掀葭嗄狎遐瑕硖瘕罅黠",
"x-ian":"锨先仙鲜纤咸贤衔舷闲涎弦嫌显险现献县腺馅羡宪陷限线冼藓岘猃暹娴氙祆鹇痫蚬筅籼酰跹",
"x-iang":"相厢镶香箱襄湘乡翔祥详想响享项巷橡像向象芗葙饷庠骧缃蟓鲞飨",
"x-iao":"萧硝霄削哮嚣销消宵淆晓小孝校肖啸笑效哓咻崤潇逍骁绡枭枵筱箫魈",
"x-ie":"楔些歇蝎鞋协挟携邪斜胁谐写械卸蟹懈泄泻谢屑偕亵勰燮薤撷廨瀣邂绁缬榭榍歙躞",
"x-in":"薪芯锌欣辛新忻心信衅囟馨莘歆铽鑫",
"x-ing":"星腥猩惺兴刑型形邢行醒幸杏性姓陉荇荥擤悻硎",
"x-iong":"兄凶胸匈汹雄熊芎",
"x-iu":"休修羞朽嗅锈秀袖绣莠岫馐庥鸺貅髹",
"x-v":"墟戌需虚嘘须徐许蓄酗叙旭序畜恤絮婿绪续讴诩圩蓿怵洫溆顼栩煦砉盱胥糈醑",
"x-van":"轩喧宣悬旋玄选癣眩绚儇谖萱揎馔泫洵渲漩璇楦暄炫煊碹铉镟痃",
"x-ve":"靴薛学穴雪血噱泶鳕谑",
"x-vn":"勋熏循旬询寻驯巡殉汛训讯逊迅巽埙荀薰峋徇浔曛窨醺鲟",
"y-a":"压押鸦鸭呀丫芽牙蚜崖衙涯雅哑亚讶伢揠吖岈迓娅琊桠氩砑睚痖",
"y-an":"焉咽阉烟淹盐严研蜒岩延言颜阎炎沿奄掩眼衍演艳堰燕厌砚雁唁彦焰宴谚验厣靥赝俨偃兖讠谳郾鄢芫菸崦恹闫阏洇湮滟妍嫣琰晏胭腌焱罨筵酽魇餍鼹",
"y-ang":"殃央鸯秧杨扬佯疡羊洋阳氧仰痒养样漾徉怏泱炀烊恙蛘鞅",
"y-ao":"邀腰妖瑶摇尧遥窑谣姚咬舀药要耀夭爻吆崾徭瀹幺珧杳曜肴鹞窈繇鳐",
"y-e":"椰噎耶爷野冶也页掖业叶曳腋夜液谒邺揶馀晔烨铘",
"y-ee":"一壹医揖铱依伊衣颐夷遗移仪胰疑沂宜姨彝椅蚁倚已乙矣以艺抑易邑屹亿役臆逸肄疫亦裔意毅忆义益溢诣议谊译异翼翌绎刈劓佾诒圪圯埸懿苡薏弈奕挹弋呓咦咿噫峄嶷猗饴怿怡悒漪迤驿缢殪贻旖熠钇镒镱痍瘗癔翊衤蜴舣羿翳酏黟",
"y-in":"茵荫因殷音阴姻吟银淫寅饮尹引隐印胤鄞堙茚喑狺夤氤铟瘾蚓霪龈",
"y-ing":"英樱婴鹰应缨莹萤营荧蝇迎赢盈影颖硬映嬴郢茔莺萦撄嘤膺滢潆瀛瑛璎楹鹦瘿颍罂",
"y-o":"哟唷",
"y-ong":"拥佣臃痈庸雍踊蛹咏泳涌永恿勇用俑壅墉慵邕镛甬鳙饔",
"y-ou":"幽优悠忧尤由邮铀犹油游酉有友右佑釉诱又幼卣攸侑莸呦囿宥柚猷牖铕疣蝣鱿黝鼬",
"y-v":"迂淤于盂榆虞愚舆余俞逾鱼愉渝渔隅予娱雨与屿禹宇语羽玉域芋郁吁遇喻峪御愈欲狱育誉浴寓裕预豫驭禺毓伛俣谀谕萸蓣揄喁圄圉嵛狳饫庾阈妪妤纡瑜昱觎腴欤於煜燠聿钰鹆瘐瘀窳蝓竽舁雩龉",
"y-van":"鸳渊冤元垣袁原援辕园员圆猿源缘远苑愿怨院塬沅媛瑗橼爰眢鸢螈鼋",
"y-ve":"曰约越跃钥岳粤月悦阅龠樾刖钺",
"y-vn":"耘云郧匀陨允运蕴酝晕韵孕郓芸狁恽纭殒昀氲",
"z-a":"匝砸杂拶咂",
"z-ai":"栽哉灾宰载再在咱崽甾",
"z-an":"攒暂赞瓒昝簪糌趱錾",
"z-ang":"赃脏葬奘戕臧",
"z-ao":"遭糟凿藻枣早澡蚤躁噪造皂灶燥唣缫",
"z-e":"责择则泽仄赜啧迮昃笮箦舴",
"z-ei":"贼",
"z-en":"怎谮",
"z-eng":"增憎曾赠缯甑罾锃",
"zh-a":"扎喳渣札轧铡闸眨栅榨咋乍炸诈揸吒咤哳怍砟痄蚱齄",
"zh-ai":"摘斋宅窄债寨砦",
"zh-an":"瞻毡詹粘沾盏斩辗崭展蘸栈占战站湛绽谵搌旃",
"zh-ang":"樟章彰漳张掌涨杖丈帐账仗胀瘴障仉鄣幛嶂獐嫜璋蟑",
"zh-ao":"招昭找沼赵照罩兆肇召爪诏棹钊笊",
"zh-e":"遮折哲蛰辙者锗蔗这浙谪陬柘辄磔鹧褚蜇赭",
"zh-en":"珍斟真甄砧臻贞针侦枕疹诊震振镇阵缜桢榛轸赈胗朕祯畛鸩",
"zh-eng":"蒸挣睁征狰争怔整拯正政帧症郑证诤峥钲铮筝",
"zh-i":"芝枝支吱蜘知肢脂汁之织职直植殖执值侄址指止趾只旨纸志挚掷至致置帜峙制智秩稚质炙痔滞治窒卮陟郅埴芷摭帙忮彘咫骘栉枳栀桎轵轾攴贽膣祉祗黹雉鸷痣蛭絷酯跖踬踯豸觯",
"zh-ong":"中盅忠钟衷终种肿重仲众冢锺螽舂舯踵",
"zh-ou":"舟周州洲诌粥轴肘帚咒皱宙昼骤啄着倜诹荮鬻纣胄碡籀舳酎鲷",
"zh-u":"珠株蛛朱猪诸诛逐竹烛煮拄瞩嘱主著柱助蛀贮铸筑住注祝驻伫侏邾苎茱洙渚潴驺杼槠橥炷铢疰瘃蚰竺箸翥躅麈",
"zh-ua":"抓",
"zh-uai":"拽",
"zh-uan":"专砖转撰赚篆抟啭颛",
"zh-uang":"桩庄装妆撞壮状丬",
"zh-ui":"椎锥追赘坠缀萑骓缒",
"zh-un":"谆准",
"zh-uo":"捉拙卓桌琢茁酌灼浊倬诼廴蕞擢啜浞涿杓焯禚斫",
"z-i":"兹咨资姿滋淄孜紫仔籽滓子自渍字谘嵫姊孳缁梓辎赀恣眦锱秭耔笫粢觜訾鲻髭",
"z-ong":"鬃棕踪宗综总纵腙粽",
"z-ou":"邹走奏揍鄹鲰",
"z-u":"租足卒族祖诅阻组俎菹啐徂驵蹴",
"z-uan":"钻纂攥缵",
"z-ui":"嘴醉最罪",
"z-un":"尊遵撙樽鳟",
"z-uo":"昨左佐柞做作坐座阝阼胙祚酢",
"c-ou":"薮楱辏腠",
"n-ang":"攮哝囔馕曩",
"o":"喔",
"d-ia":"嗲",
"ch-uai":"嘬膪踹",
"c-en":"岑涔",
"d-iu":"铥",
"n-ou":"耨",
"f-ou":"缶",
"b-ia":"髟"
};

// 末尾字符
const ENDING_CHARS=gen_set('.。,，/?？!！…~～@^、+=-_♂♀ ');
// 识别空格的正则表达式
var trim_space_re=/[ 　]+/g;
// 生成集合
function gen_set(st) {
	var obj={};
	for(var i=0; i<st.length; i++) {
		obj[st[i]]=true;
	}
	return obj;
}
// 字符转换
var WIDTH_TABLE={};
(function() {
	var before='　１２３４５６７８９０!＠＃＄％＾＆＊（）－＝＿＋［］｛｝;＇:＂,．／＜＞?＼｜｀～ｑｗｅｒｔｙｕｉｏｐａｓｄｆｇｈｊｋｌｚｘｃｖｂｎｍＱＷＥＲＴＹＵＩＯＰＡＳＤＦＧＨＪＫＬＺＸＣＶＢＮＭ';
	var after=' 1234567890！@#$%^&*()-=_+[]{}；\'："，./<>？\\|`~qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
	for(var i=0; i<before.length; i++){
		WIDTH_TABLE[before[i]]=after[i];
	}
})();
// 谐音转换
var PINYIN_TABLE={}; // '周': [symbols['zh'], symbols['ou']], '啊': [symbols['a']]
(function() {
	var symbols={}; // 'a': '\ue000'
	var symbol_idx=0xe000; // U+E000 ~ U+F8FF: Private Use Area
	for(var phonetic_raw in PINYIN_DICT_RAW) {
		var phonetics=phonetic_raw.split('-').map(function(phonetic) {
			if(!symbols[phonetic])
				return (symbols[phonetic]=String.fromCharCode(symbol_idx++));
			else
				return symbols[phonetic];
		}).join('');
		var str=PINYIN_DICT_RAW[phonetic_raw];
		for(var i=str.length-1;i>=0;i--)
			PINYIN_TABLE[str[i]]=phonetics;
	}
	delete PINYIN_DICT_RAW;
})();

// 合并函数
function parse(input, callback) {
	/* input数组成员的格式
	 * {
	 *     id : 1 //主键
	 *     text : "hello" //弹幕内容 
	 * }
	 */
	// 统计数据
	var S = {
		identical: 0,// 相同弹幕
		edit_distance: 0,// 相似弹幕
		pinyin_distance: 0,// 谐音弹幕
		cosine_distance: 0,// 词频向量相近
	};
	
	// 预处理
	function detaolu(string) {
		var len=string.length;
		var text='';
		// 处理末尾标点
		if(config.combine.ending) {
			while(ENDING_CHARS[string.charAt(len-1)]!==undefined){
				len--;
			}
			// 比如弹幕只有一个标点
			if(len==0){
				len=string.length
			};
		}
		// 忽略全半角差异
		for(var i=0;i<len;i++) {
			var to=config.combine.width ? WIDTH_TABLE[string.charAt(i)] : undefined;
			if(to!==undefined){
				text+=to;
			}
			else{
				text+=string.charAt(i);
			}
		}
		// 忽略多余空格
		if(config.combine.space){
			text=text.replace(trim_space_re,' ');
		}
		return text;
	}
	
	// 处理拼音
	function trim_pinyin(s) {
		return Array.from(s.toLowerCase()).map(function(c) {
			return PINYIN_TABLE[c] || c;
		}).join('');
	}
	
	var count = input.length;
	var start_time = Date.now();
	callback(`弹幕总条数为${input.length}`);
	var danmakus=[];
	var out_danmakus=[];// 输出弹幕
	callback(`正在进行预处理`);
	input.forEach(function(obj, index) {
		var detaolued=detaolu(obj.text);// 预处理
		var str_pinyin = config.combine.pinyin ? trim_pinyin(detaolued) : null;// 拼音字符串
		
		// 弹幕对象
		var dm_obj={
			id: obj.id,// 数据库的主键
			str: detaolued, // 处理后的文字
			orig_str: obj.text, // 处理前的文字
			str_pinyin: str_pinyin, // 拼音字符串
			str_2gram: gen_2gram_array(detaolued),// 词频向量
			peers: []// 相似弹幕数组
		};
		danmakus.push(dm_obj);
	});
	
	var unique_danmakus = [];// 记录唯一弹幕
	callback(`正在进行合并（计算量很大，请耐心等待）`);
	callback(`提示：前一个百分数为平方进度，适宜算法的时间复杂度；后一个百分数为真实进度`);
	// 以下为计算平方进度
	var progress = 0;
	var count_pow = Math.pow(count, 2);
	var step = count_pow / 100;
	var next = Math.floor(Math.sqrt(step * progress));
	danmakus.forEach(function(dm, index) {
		// 200条以上才显示进度
		if(count > 200 && index == next){
			callback(`已合并${index} / ${count}  ${progress}%（${Math.floor(index * 100 / count)}%）`);
			progress ++;
			next = Math.floor(Math.sqrt(step * progress));
		}
		for(var i=0; i<unique_danmakus.length; i++) {
			var another=unique_danmakus[i];
			// 判断是否相似
			var flag=similar_memorized(
				dm.str, another.str,
				dm.str_2gram, another.str_2gram,
				dm.str_pinyin, another.str_pinyin,
				S
			);
			if(flag) {
				// 合并
				another.peers.push({
					id : dm.id,
					str : dm.str,
					orig_str : dm.orig_str
				});
				return;
			}
		}
		dm.peers.push({
					id : dm.id,
					str : dm.str,
					orig_str : dm.orig_str
				});
		unique_danmakus.push(dm);
	});
	
	callback(`已合并${count} / ${count}  100%（100%）`);
	callback(`正在组合弹幕文本`);
	// 选择所有相似弹幕中出现最多的弹幕，作为合并后的弹幕
	unique_danmakus.forEach(function(dm) {
		if(dm.peers.length >= 2) {
			var text_counts={}, most_index=0, most_count=-1;
			dm.peers.forEach(function(peer,index) {
				if(!text_counts[peer.str]){
					text_counts[peer.str]=0;
				}
				if(++text_counts[peer.str]>most_count) {
					most_count=text_counts[peer.str];
					most_index=index;
				}
			});
			if(dm.peers[most_index].str != dm.str){
				dm.orig_str = dm.peers[most_index].orig_str;
			}
		}
	});
	
	callback(`正在输出数据`);
	unique_danmakus.forEach(function(dm) {
		for(var i = 0; i < dm.peers.length; i ++){
			out_danmakus.push([ dm.peers[i].id, dm.orig_str ]);
		}
	});
	callback(`弹幕合并成功`);
	
	// 输出统计信息
	var end_time = Date.now();
	callback("%%% 统计信息 %%%\n"
	+ `内容相同：${S.identical}\n`
	+ `内容相似：${S.edit_distance}\n`
	+ `谐音弹幕：${S.pinyin_distance}\n`
	+ `词频向量相近：${S.cosine_distance}\n`
	+ `耗时：${(end_time - start_time) / 1000}秒`
	);
	return out_danmakus;
}

var ed_a = new Int16Array (0x10ffff);
var ed_b = new Int16Array (0x10ffff);
var ed_counts = ed_a; // to save memory

var MIN_DANMAKU_SIZE=10;

function edit_distance (P, Q) { // this is NOT the edit_distance you think
	'use strict';
	for (var i = 0; i < P.length; i ++) ed_counts [P.charCodeAt (i)] ++;
	for (var i = 0; i < Q.length; i ++) ed_counts [Q.charCodeAt (i)] --;
	var ans = 0;
	for (var i = 0; i < P.length; i ++) {
		ans += Math.abs (ed_counts[P.charCodeAt (i)]);
		ed_counts[P.charCodeAt (i)] = 0;
	}
	for (var i = 0; i < Q.length; i ++) {
		ans += Math.abs (ed_counts[Q.charCodeAt (i)]);
		ed_counts[Q.charCodeAt (i)] = 0;
	}
	return ans;
}

function gen_2gram_array(P) {
	var P_length_1=P.length;
	P+=P.charAt(0);
	var res=[];
	for(var i=0;i<P_length_1;i++)
		res.push(hash(P.charCodeAt(i),P.charCodeAt(i+1)));
	return res;
}

function hash(a, b) {
    return ((a<<10)^b)&1048575;
}

function cosine_distance_memorized (Pgram, Qgram, Plen, Qlen) {
	'use strict';
	if(parseInt(config.combine.max_cosine.replace("%", "")) > 100) return 0;
	for (var i = 0; i < Plen; i++)
		ed_a[Pgram[i]]++;
	for (var i = 0; i < Qlen; i++)
		ed_b[Qgram[i]]++;
	var x = 0, y = 0, z = 0;
	for (var i = 0; i < Plen; i ++) {
		var h1=Pgram[i];
		if (ed_a[h1]) {
			y += ed_a[h1] * ed_a[h1];
			if (ed_b[h1]) {
				x += ed_a[h1] * ed_b[h1];
				z += ed_b[h1] * ed_b[h1];
				ed_b[h1] = 0;
			}
			ed_a[h1] = 0;
		}
	}
	for (var i = 0; i < Qlen; i ++) {
		var h1=Qgram[i];
		if (ed_b[h1]) {
			z += ed_b[h1] * ed_b[h1];
			ed_b[h1] = 0;
		}
	}
	return x*x/y/z;
}

function similar_memorized(P,Q,Pgram,Qgram,Ppinyin,Qpinyin,S) {
	if(P==Q) {
		S.identical++;
		return true;
	}
	
	var max_dist = parseInt(config.combine.edit_distance.replace("≤", ""));
	var dis=edit_distance(P,Q);
	if((P.length+Q.length < MIN_DANMAKU_SIZE) ? dis<(P.length+Q.length)/MIN_DANMAKU_SIZE*max_dist-1 : dis<=max_dist) {
		S.edit_distance++;
		return true;
	}

	if(Ppinyin) {
		var py_dis=edit_distance(Ppinyin,Qpinyin);
		if((P.length+Q.length < MIN_DANMAKU_SIZE) ? py_dis<(P.length+Q.length)/MIN_DANMAKU_SIZE*max_dist-1 : py_dis<=max_dist) {
			S.pinyin_distance++;
			return true;
		}
	}
	
	// they have nothing similar. cosine_distance test can be bypassed
	if(dis>=P.length+Q.length){
		return false;
	}
	
	var cos=~~(cosine_distance_memorized(Pgram,Qgram,P.length,Q.length)*100);
	if(cos>=parseInt(config.combine.max_cosine.replace("%", ""))) {
		S.cosine_distance++;
		return true;
	}
	
	return false;
}

// 导出模块
module.exports = {parse};
