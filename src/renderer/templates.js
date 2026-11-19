/**
 * Sample ready-to-use animated Telegram Emoji & Sticker templates (Lottie JSON)
 * Standard 512x512, 60 FPS, < 64KB compliant
 */

const DEFAULT_TEMPLATES = [
  {
    id: 'tg_character_precomp',
    name: 'Кот Telegram (Precomp)',
    category: 'Стикеры',
    description: 'Официальная Telegram-структура: верхний уровень Precomp (ty: 0), все векторные слои внутри assets',
    previewIcon: 'smile',
    data: {
      v: "5.5.2",
      fr: 60,
      ip: 0,
      op: 180,
      w: 512,
      h: 512,
      nm: "Telegram Cat Sticker",
      ddd: 0,
      assets: [
        {
          id: "comp_character",
          layers: [
            {
              ddd: 0,
              ind: 1,
              ty: 4,
              nm: "Head & Ears (Голова и уши)",
              sr: 1,
              ks: {
                o: { a: 0, k: 100 },
                r: { a: 1, k: [{ t: 0, s: [-4] }, { t: 90, s: [4] }, { t: 180, s: [-4] }] },
                p: { a: 0, k: [256, 210, 0] },
                a: { a: 0, k: [0, 0, 0] },
                s: { a: 1, k: [{ t: 0, s: [98, 98, 100] }, { t: 90, s: [102, 102, 100] }, { t: 180, s: [98, 98, 100] }] }
              },
              ao: 0,
              shapes: [
                {
                  ty: "gr",
                  nm: "Head Base",
                  it: [
                    {
                      ty: "el",
                      nm: "Head Circle",
                      p: { a: 0, k: [0, 0] },
                      s: { a: 0, k: [220, 200] }
                    },
                    {
                      ty: "fl",
                      nm: "Head Fill",
                      c: { a: 0, k: [0.98, 0.72, 0.22, 1] }, // Warm Gold #F9B838
                      o: { a: 0, k: 100 }
                    },
                    {
                      ty: "st",
                      nm: "Head Stroke",
                      c: { a: 0, k: [0.12, 0.12, 0.15, 1] },
                      o: { a: 0, k: 100 },
                      w: { a: 0, k: 8 }
                    },
                    {
                      ty: "tr",
                      nm: "Transform",
                      p: { a: 0, k: [0, 0] },
                      a: { a: 0, k: [0, 0] },
                      s: { a: 0, k: [100, 100] },
                      r: { a: 0, k: 0 },
                      o: { a: 0, k: 100 }
                    }
                  ]
                }
              ],
              ip: 0,
              op: 180,
              st: 0,
              bm: 0
            },
            {
              ddd: 0,
              ind: 2,
              ty: 4,
              nm: "Sunglasses (Очки крутости)",
              sr: 1,
              parent: 1,
              ks: {
                o: { a: 0, k: 100 },
                r: { a: 0, k: 0 },
                p: { a: 0, k: [0, -10, 0] },
                a: { a: 0, k: [0, 0, 0] },
                s: { a: 0, k: [100, 100, 100] }
              },
              ao: 0,
              shapes: [
                {
                  ty: "gr",
                  nm: "Glasses Group",
                  it: [
                    {
                      ty: "rc",
                      nm: "Left Lens",
                      p: { a: 0, k: [-55, 0] },
                      s: { a: 0, k: [80, 50] },
                      r: { a: 0, k: 10 }
                    },
                    {
                      ty: "rc",
                      nm: "Right Lens",
                      p: { a: 0, k: [55, 0] },
                      s: { a: 0, k: [80, 50] },
                      r: { a: 0, k: 10 }
                    },
                    {
                      ty: "fl",
                      nm: "Glasses Fill",
                      c: { a: 0, k: [0.08, 0.08, 0.1, 1] },
                      o: { a: 0, k: 100 }
                    },
                    {
                      ty: "st",
                      nm: "Glasses Rim",
                      c: { a: 0, k: [0, 0.816, 0.612, 1] }, // Turquoise Rim #00D09C
                      o: { a: 0, k: 100 },
                      w: { a: 0, k: 5 }
                    },
                    {
                      ty: "tr",
                      nm: "Transform",
                      p: { a: 0, k: [0, 0] },
                      a: { a: 0, k: [0, 0] },
                      s: { a: 0, k: [100, 100] },
                      r: { a: 0, k: 0 },
                      o: { a: 0, k: 100 }
                    }
                  ]
                }
              ],
              ip: 0,
              op: 180,
              st: 0,
              bm: 0
            },
            {
              ddd: 0,
              ind: 3,
              ty: 4,
              nm: "Smile Mouth (Улыбка)",
              sr: 1,
              parent: 1,
              ks: {
                o: { a: 0, k: 100 },
                r: { a: 0, k: 0 },
                p: { a: 0, k: [0, 48, 0] },
                a: { a: 0, k: [0, 0, 0] },
                s: { a: 1, k: [{ t: 0, s: [95, 95, 100] }, { t: 90, s: [110, 110, 100] }, { t: 180, s: [95, 95, 100] }] }
              },
              ao: 0,
              shapes: [
                {
                  ty: "gr",
                  nm: "Mouth",
                  it: [
                    {
                      ty: "el",
                      nm: "Smile Tongue",
                      p: { a: 0, k: [0, 0] },
                      s: { a: 0, k: [46, 32] }
                    },
                    {
                      ty: "fl",
                      nm: "Tongue Fill",
                      c: { a: 0, k: [0.95, 0.25, 0.35, 1] }, // Pink #F24059
                      o: { a: 0, k: 100 }
                    },
                    {
                      ty: "st",
                      nm: "Mouth Stroke",
                      c: { a: 0, k: [0.12, 0.12, 0.15, 1] },
                      o: { a: 0, k: 100 },
                      w: { a: 0, k: 4 }
                    },
                    {
                      ty: "tr",
                      nm: "Transform",
                      p: { a: 0, k: [0, 0] },
                      a: { a: 0, k: [0, 0] },
                      s: { a: 0, k: [100, 100] },
                      r: { a: 0, k: 0 },
                      o: { a: 0, k: 100 }
                    }
                  ]
                }
              ],
              ip: 0,
              op: 180,
              st: 0,
              bm: 0
            }
          ]
        }
      ],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 3, // Null Master Controller
          nm: "Master Null Controller",
          sr: 1,
          ks: {
            o: { a: 0, k: 100 },
            r: { a: 0, k: 0 },
            p: { a: 0, k: [256, 256, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: { a: 0, k: [100, 100, 100] }
          },
          ao: 0,
          ip: 0,
          op: 180,
          st: 0,
          bm: 0
        },
        {
          ddd: 0,
          ind: 2,
          ty: 0, // Precomp Layer!
          nm: "Character Comp (Векторный персонаж)",
          refId: "comp_character",
          parent: 1,
          sr: 1,
          ks: {
            o: { a: 0, k: 100 },
            r: { a: 0, k: 0 },
            p: { a: 1, k: [{ t: 0, s: [0, 0, 0] }, { t: 90, s: [0, -15, 0] }, { t: 180, s: [0, 0, 0] }] },
            a: { a: 0, k: [256, 256, 0] },
            s: { a: 1, k: [{ t: 0, s: [100, 100, 100] }, { t: 90, s: [105, 95, 100] }, { t: 180, s: [100, 100, 100] }] }
          },
          w: 512,
          h: 512,
          ip: 0,
          op: 180,
          st: 0,
          bm: 0
        }
      ]
    }
  },
  {
    id: 'badge_star',
    name: 'Звездный Бейдж',
    category: 'Эмодзи',
    description: 'Пульсирующая неоновая звезда с крутящейся орбитой и местом под надпись',
    previewIcon: 'star',
    data: {
      v: "5.5.2",
      fr: 60,
      ip: 0,
      op: 180,
      w: 512,
      h: 512,
      nm: "Star Badge Template",
      ddd: 0,
      assets: [],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 4,
          nm: "Outer Orbit",
          sr: 1,
          ks: {
            o: { a: 0, k: 80 },
            r: { a: 1, k: [{ t: 0, s: [0] }, { t: 180, s: [360] }] },
            p: { a: 0, k: [256, 230, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: { a: 0, k: [100, 100, 100] }
          },
          ao: 0,
          shapes: [
            {
              ty: "gr",
              nm: "Orbit Group",
              it: [
                {
                  ty: "el",
                  nm: "Dashed Circle",
                  p: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [260, 260] }
                },
                {
                  ty: "st",
                  nm: "Stroke",
                  c: { a: 0, k: [0, 0.816, 0.612, 1] }, // #00D09C
                  o: { a: 0, k: 80 },
                  w: { a: 0, k: 6 },
                  d: [{ n: "d", v: { a: 0, k: 15 } }, { n: "g", v: { a: 0, k: 10 } }]
                },
                {
                  ty: "tr",
                  nm: "Transform",
                  p: { a: 0, k: [0, 0] },
                  a: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [100, 100] },
                  r: { a: 0, k: 0 },
                  o: { a: 0, k: 100 }
                }
              ]
            }
          ],
          ip: 0,
          op: 180,
          st: 0,
          bm: 0
        },
        {
          ddd: 0,
          ind: 2,
          ty: 4,
          nm: "Star Core",
          sr: 1,
          ks: {
            o: { a: 0, k: 100 },
            r: { a: 1, k: [{ t: 0, s: [0] }, { t: 90, s: [15] }, { t: 180, s: [0] }] },
            p: { a: 0, k: [256, 230, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: { a: 1, k: [{ t: 0, s: [95, 95, 100] }, { t: 90, s: [110, 110, 100] }, { t: 180, s: [95, 95, 100] }] }
          },
          ao: 0,
          shapes: [
            {
              ty: "gr",
              nm: "Star Group",
              it: [
                {
                  ty: "sr",
                  nm: "Polystar",
                  sy: 1,
                  p: { a: 0, k: [0, 0] },
                  r: { a: 0, k: 0 },
                  pt: { a: 0, k: 5 },
                  ir: { a: 0, k: 55 },
                  is: { a: 0, k: 0 },
                  or: { a: 0, k: 110 },
                  os: { a: 0, k: 0 }
                },
                {
                  ty: "fl",
                  nm: "Fill",
                  c: { a: 0, k: [1, 0.78, 0.17, 1] }, // Gold #FFC72C
                  o: { a: 0, k: 100 }
                },
                {
                  ty: "st",
                  nm: "Stroke",
                  c: { a: 0, k: [1, 1, 1, 1] },
                  o: { a: 0, k: 90 },
                  w: { a: 0, k: 5 }
                },
                {
                  ty: "tr",
                  nm: "Transform",
                  p: { a: 0, k: [0, 0] },
                  a: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [100, 100] },
                  r: { a: 0, k: 0 },
                  o: { a: 0, k: 100 }
                }
              ]
            }
          ],
          ip: 0,
          op: 180,
          st: 0,
          bm: 0
        }
      ]
    }
  },
  {
    id: 'cyber_shield',
    name: 'Кибер Щит VIP',
    category: 'Стикеры',
    description: 'Футуристичный защитный щит с плавной динамикой для клановых и VIP эмодзи',
    previewIcon: 'shield',
    data: {
      v: "5.5.2",
      fr: 60,
      ip: 0,
      op: 180,
      w: 512,
      h: 512,
      nm: "Cyber Shield",
      ddd: 0,
      assets: [],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 4,
          nm: "Shield Plate",
          sr: 1,
          ks: {
            o: { a: 0, k: 100 },
            r: { a: 0, k: 0 },
            p: { a: 1, k: [{ t: 0, s: [256, 235, 0] }, { t: 90, s: [256, 220, 0] }, { t: 180, s: [256, 235, 0] }] },
            a: { a: 0, k: [0, 0, 0] },
            s: { a: 1, k: [{ t: 0, s: [100, 100, 100] }, { t: 90, s: [104, 104, 100] }, { t: 180, s: [100, 100, 100] }] }
          },
          ao: 0,
          shapes: [
            {
              ty: "gr",
              nm: "Shield Shape",
              it: [
                {
                  ty: "rc",
                  nm: "Rounded Box",
                  p: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [180, 210] },
                  r: { a: 0, k: 30 }
                },
                {
                  ty: "fl",
                  nm: "Fill",
                  c: { a: 0, k: [0.08, 0.58, 0.98, 1] }, // Electric Blue
                  o: { a: 0, k: 95 }
                },
                {
                  ty: "st",
                  nm: "Border",
                  c: { a: 0, k: [1, 1, 1, 1] },
                  o: { a: 0, k: 100 },
                  w: { a: 0, k: 7 }
                },
                {
                  ty: "tr",
                  nm: "Transform",
                  p: { a: 0, k: [0, 0] },
                  a: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [100, 100] },
                  r: { a: 0, k: 0 },
                  o: { a: 0, k: 100 }
                }
              ]
            }
          ],
          ip: 0,
          op: 180,
          st: 0,
          bm: 0
        }
      ]
    }
  },
  {
    id: 'blank',
    name: 'Пустая композиция',
    category: 'Базовые',
    description: 'Чистый холст 512×512, 60 FPS для создания нового стикера с нуля',
    previewIcon: 'plus-square',
    data: {
      v: "5.5.2",
      fr: 60,
      ip: 0,
      op: 180,
      w: 512,
      h: 512,
      nm: "New Emoji Composition",
      ddd: 0,
      assets: [],
      layers: [
        {
          ddd: 0,
          ind: 1,
          ty: 4,
          nm: "Background Glow",
          sr: 1,
          ks: {
            o: { a: 1, k: [{ t: 0, s: [40], h: 0 }, { t: 90, s: [85], h: 0 }, { t: 180, s: [40] }] },
            r: { a: 1, k: [{ t: 0, s: [0] }, { t: 180, s: [360] }] },
            p: { a: 0, k: [256, 256, 0] },
            a: { a: 0, k: [0, 0, 0] },
            s: { a: 1, k: [{ t: 0, s: [90, 90, 100] }, { t: 90, s: [105, 105, 100] }, { t: 180, s: [90, 90, 100] }] }
          },
          ao: 0,
          shapes: [
            {
              ty: "gr",
              nm: "Circle",
              it: [
                {
                  ty: "el",
                  nm: "Ellipse Path",
                  p: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [220, 220] }
                },
                {
                  ty: "st",
                  nm: "Stroke",
                  c: { a: 0, k: [0.063, 0.725, 0.506, 1] }, // Emerald #10B981
                  o: { a: 0, k: 90 },
                  w: { a: 0, k: 8 },
                  lc: 2,
                  lj: 2
                },
                {
                  ty: "tr",
                  nm: "Transform",
                  p: { a: 0, k: [0, 0] },
                  a: { a: 0, k: [0, 0] },
                  s: { a: 0, k: [100, 100] },
                  r: { a: 0, k: 0 },
                  o: { a: 0, k: 100 },
                  sk: { a: 0, k: 0 },
                  sa: { a: 0, k: 0 }
                }
              ]
            }
          ],
          ip: 0,
          op: 180,
          st: 0,
          bm: 0
        }
      ]
    }
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_TEMPLATES };
}
if (typeof window !== 'undefined') {
  window.DEFAULT_TEMPLATES = DEFAULT_TEMPLATES;
}
