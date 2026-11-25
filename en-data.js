// 英文打字練習資料：常用英文單字（大致按常用程度排列）與原創短文
window.EN_WORDS = (
  'the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or ' +
  'an will my one all would there their what so up out if about who get which go me when make can like time no just ' +
  'him know take people into year your good some could them see other than then now look only come its over think also ' +
  'back after use two how our work first well way even new want because any these give day most us is was are has had ' +
  'were been very much more many such where why each through down still own should here around last same while place ' +
  'long little great small right old big high different large next early young important few public bad able man woman ' +
  'child world school state family student group country problem hand part case week company system program question ' +
  'government number night point home water room mother area money story fact month lot study book eye job word business ' +
  'issue side kind head house service friend father power hour game line end member law car city community name ' +
  'president team minute idea kid body information school face others level office door health person art war history ' +
  'party result change morning reason research girl guy moment air teacher force education foot boy age policy music ' +
  'market sense nation plan college interest death experience effect class control care field development role effort ' +
  'rate heart drug show leader light voice wife police mind price report decision son view relationship town road arm ' +
  'difference value building action model season society tax director position player record paper space ground form ' +
  'event official matter center couple site project activity star table need court oil situation cost industry figure ' +
  'street image phone data picture practice piece land product doctor wall patient worker news test movie north love ' +
  'support technology step baby computer type attention film tree source organization hair window evidence population ' +
  'site garden river happy simple open close begin start stop help learn teach read write speak listen walk run play ' +
  'sleep eat drink cook clean wash buy sell pay send bring carry hold keep leave live move turn watch wait call ask ' +
  'answer try find feel tell show follow build grow fall rise win lose pass meet visit travel remember forget believe ' +
  'understand explain decide choose agree enjoy hope wish worry laugh smile cry sing dance draw paint swim fly drive ' +
  'ride climb jump throw catch kick push pull open always never often sometimes usually today tomorrow yesterday ' +
  'together again already almost enough quite really soon later early before after above below between inside outside ' +
  'under near far fast slow hot cold warm cool dark bright quiet loud easy hard soft strong weak rich poor clean dirty ' +
  'full empty heavy light short tall wide deep fresh sweet sour bitter beautiful wonderful careful useful friendly ' +
  'red blue green yellow black white orange purple brown pink apple banana bread rice noodle egg milk tea coffee juice ' +
  'cake fish chicken beef soup salad dog cat bird horse rabbit tiger monkey elephant flower grass mountain sea beach ' +
  'island sky sun moon rain snow wind cloud spring summer autumn winter bus train plane ship bike ticket hotel airport ' +
  'library hospital bank shop restaurant kitchen bedroom table chair desk bed lamp clock pen pencil bag box key letter'
).split(' ').filter((w, i, a) => w && a.indexOf(w) === i);

window.EN_PASSAGES = [
  { title: 'A Rainy Morning', text: 'It was raining when I woke up this morning. I made a cup of hot tea and sat by the window. The streets were quiet, and the trees looked fresh and green. I decided to stay at home, read a good book, and enjoy the sound of the rain.' },
  { title: 'My Best Friend', text: 'My best friend is Sam. We met in primary school, and we have been friends for ten years. Sam is kind, funny, and always ready to help. When I feel sad, he tells me a silly joke, and I cannot stop laughing.' },
  { title: 'Learning to Type', text: 'Typing is a useful skill. At first, it feels slow, and you may want to look at the keyboard. Try to keep your eyes on the screen and your fingers on the home row. Practice a little every day, and your speed will grow step by step.' },
  { title: 'A Trip to the Beach', text: 'Last summer, my family took a trip to the beach. We built a big sandcastle, swam in the clear blue sea, and collected small shells. In the evening, we watched the sun go down. It was one of the best days of the year.' },
  { title: 'The Little Garden', text: 'Behind our house, there is a little garden. My grandmother grows tomatoes, beans, and bright yellow flowers there. Every weekend, I help her water the plants and pull out the weeds. She says a garden teaches us to be patient.' },
  { title: 'Healthy Habits', text: 'Good habits keep us healthy. Drink enough water, eat fruit and vegetables, and go to bed on time. Try to move your body for at least thirty minutes a day. Small changes, done every day, can make a big difference.' },
  { title: 'The City at Night', text: 'At night, the city looks like a different world. Thousands of lights shine from tall buildings, and the harbour reflects their colours. Buses and trams still run, and small shops stay open late. Some people say the city never sleeps.' },
  { title: 'Saving Time', text: 'Do you often feel that there is not enough time? Make a simple list each morning. Put the most important task first, and finish it before you check your phone. You may be surprised by how much you can do.' },
];
