let globalMutashabihatMap = {};
const suraLengths = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];

function getSoraAyaNumber(ayat) {
    let current = ayat;
    for (let i = 0; i < suraLengths.length; i++) {
        if (current <= suraLengths[i]) return quran(i + 1, current)
        // { sura: i + 1, aya: current };
        current -= suraLengths[i];
    }
    return null;
}
//getSoraAyaNumber(9)




/*

let ul = document.getElementById('box');


async function quran() {
    await fetch("./data/hafs.json")
        .then(r => r.json())
        .then(data => {
            async function motashabih() {
                await fetch('./data/mutashabihat.json')
                    .then(res => res.json())
                    .then(info => {
                        
                        for (let i = 29; i < 31; i++) {
                            info[`${i}`].map((e)=>{
                                if (typeof e.src.ayah === 'object') {
                                 for (let x = 0; x < e.src.ayah.length; x++) {
                                     
                                     let h = document.createElement('h2')
                                     h.textContent=data[e.src.ayah[x]].aya_text.slice(0,-2); 
                                     ul.append(h)
                                 }
                                 if (typeof e.muts[0].ayah === 'object'){
                                     for (let n = 0; n < e.muts[0].ayah.length; n++){
                            //console.log(data[e.muts[0].ayah[n]].aya_text)
                            let li = document.createElement('li')
                                     li.textContent=data[e.muts[0].ayah[n]].aya_text.slice(0,-2);
                                     ul.append(li)
                                     }
                                 }else{
                                    // console.log(data[e.muts[0].ayah].aya_text)
                                     
                                     let li = document.createElement('li')
                                     li.textContent=data[e.muts[0].ayah].aya_text.slice(0,-2);
                                     ul.append(li)
                                 }
                                 
                                }else{
                                   // console.log(e.src.ayah)
                                    let h = document.createElement('h2')
                                    let li = document.createElement('li')
                                    h.textContent=data[e.src.ayah].aya_text.slice(0,-2,0);
                                     li.textContent=data[e.muts[0].ayah].aya_text .slice(0,-2); 
                        ul.append(h)             
                                     ul.append(li)
                                }
                                
                            })
                        }
                    
                    })
            }
            
            motashabih()
            
        })
}
quran()
*/


const ul = document.getElementById('box');

async function quran() {
    try {
        const data = await fetch("./data/hafs.json").then(r => r.json());
        const info = await fetch('./data/mutashabihat.json').then(r => r.json());

        for (let i = 1; i < 2; i++) {
            const group = info[`${i}`];
            if (!group) continue; // تخطى لو المجموعة مش موجودة

            group.forEach(e => {
                // نوحد التعامل: نخلي src.ayah دايماً مصفوفة
                const srcAyat = Array.isArray(e.src.ayah)? e.src.ayah : [e.src.ayah];

                // نطبع كل آية مصدر كـ h2
                srcAyat.forEach(ayahIndex => {
                    const ayahData = data[ayahIndex];
                    if (!ayahData) return;
                    const h = document.createElement('h2');
                    h.textContent = ayahData.aya_text.slice(0, -2)+ ` {سورة  ${ayahData.sura_name_ar} الآية: ${ayahData.aya_no}}`;
                    ul.append(h);
                });

                // نمر على كل المتشابهات، مش بس muts[0]
                e.muts.forEach(mut => {
                    const mutAyat = Array.isArray(mut.ayah)? mut.ayah : [mut.ayah];

                    mutAyat.forEach(ayahIndex => {
                        const ayahData = data[ayahIndex];
                        if (!ayahData) return;
                        const li = document.createElement('li');
                        li.textContent = ayahData.aya_text.slice(0, -2) + ` {سورة  ${ayahData.sura_name_ar} الآية: ${ayahData.aya_no}}`;
                        ul.append(li);
                    });
                });
            });
        }
    } catch (err) {
        console.error("خطأ:", err);
        ul.textContent = "فشل تحميل البيانات";
    }
}

quran();

