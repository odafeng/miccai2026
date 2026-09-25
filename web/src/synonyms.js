// Query-side expansion: lexical TF-IDF cannot match synonyms on its own.
window.M = window.M || {};
M.SYNONYMS = {
  colorectal: ["colon", "rectal", "rectum", "colonoscopy", "polyp"], colon: ["colorectal", "colonoscopy"],
  rectal: ["rectum", "colorectal"], polyp: ["colonoscopy", "polyps"], surgical: ["surgery", "intraoperative", "laparoscopic"],
  surgery: ["surgical", "intraoperative"], laparoscopic: ["laparoscopy", "minimally", "invasive"], laparoscopy: ["laparoscopic"],
  robotic: ["robot", "robotics", "vinci"], endoscopy: ["endoscopic", "colonoscopy", "gastroscopy"],
  segmentation: ["segment", "delineation", "mask"], registration: ["alignment", "deformable"],
  mri: ["mr", "magnetic"], ct: ["tomography", "computed"], ultrasound: ["sonography", "echocardiography", "us"],
  pathology: ["histopathology", "wsi", "slide", "histology"], wsi: ["slide", "histopathology"],
  llm: ["language", "llms", "gpt"], vlm: ["vision-language", "vlms", "multimodal"], agent: ["agentic", "agents"],
  diffusion: ["generative", "denoising"], foundation: ["pretrained", "pretraining"], survival: ["prognosis", "outcome"],
  prognosis: ["survival", "outcome"], phase: ["workflow", "recognition"], gesture: ["action", "workflow"],
  skill: ["proficiency", "assessment"], tumor: ["tumour", "cancer", "lesion"], cancer: ["tumor", "carcinoma", "malignancy"],
  "大腸": ["colorectal", "colon", "colonoscopy"], "直腸": ["rectal", "rectum"], "結腸": ["colon"], "息肉": ["polyp"],
  "手術": ["surgical", "surgery", "intraoperative"], "腹腔鏡": ["laparoscopic", "laparoscopy"], "機器人": ["robotic", "robot"],
  "內視鏡": ["endoscopy", "endoscopic"], "分割": ["segmentation"], "配準": ["registration"], "重建": ["reconstruction"],
  "病理": ["pathology", "histopathology", "wsi"], "超音波": ["ultrasound"], "心臟": ["cardiac", "heart"], "腦": ["brain"],
  "肺": ["lung", "pulmonary"], "乳房": ["breast"], "乳癌": ["breast", "cancer"], "肝": ["liver", "hepatic"], "眼底": ["fundus", "retinal"],
  "視網膜": ["retinal", "retina"], "擴散模型": ["diffusion"], "基礎模型": ["foundation"], "語言模型": ["llm", "language"],
  "代理": ["agent", "agentic"], "預後": ["prognosis", "survival"], "存活": ["survival"], "報告生成": ["report", "generation"],
  "不確定性": ["uncertainty"], "聯邦學習": ["federated"], "可解釋": ["interpretable", "explainability"],
};
