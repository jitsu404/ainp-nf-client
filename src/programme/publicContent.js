// Content of the public site taken from the institute's websites, so the pages work without
// fetching them (the browser can't load other sites' pages). Each block names its source page;
// update the data here when the source changes. Taken on 24 Nov 2026.

export const PCU = {
  source: "https://iifsr.org.in/PCU.php",
  intro:
    "The Project Coordination Unit (PC Unit) coordinates the research, administrative and financial aspects of the plan schemes run by ICAR-IIFSR: the All India Coordinated Research Project on Integrated Farming Systems (AICRP-IFS) and the All India Network Programme on Organic Farming (AINP-OF). It also runs research projects linked to these schemes, and externally funded projects from national and international agencies.",
  mandate:
    "To coordinate and monitor integrated farming systems and organic farming research in the country.",
  activities: [
    "Coordinate and monitor research and development on integrated farming systems and organic farming through the on-station and on-farm research centres of AICRP-IFS and AI-NPOF.",
    "Build a repository of information on cropping systems, farming systems and organic farming research in the country.",
  ],
  links: [
    {
      label:
        "All India Coordinated Research Project on Integrated Farming Systems (AICRP-IFS)",
      href: "https://iifsr.org.in/AICRP-IFS.html",
    },
    {
      label: "All India Network Programme on Organic Farming (AI-NPOF)",
      href: "https://iifsr.org.in/AI-NPOF.html",
    },
  ],
  staff: [
    [
      "Dr. N. Ravisankar",
      "Principal Scientist (Agronomy), Project Coordinator",
    ],
    ["Dr. A. K. Prusty", "Principal Scientist (Aquaculture)"],
    ["Dr. M. Shamim", "Senior Scientist (Agril. Meteorology)"],
    ["Dr. M. A. Ansari", "Senior Scientist (Agronomy)"],
    ["Dr. Raghuveer Singh", "Senior Scientist (Agronomy)"],
    ["Dr. Raghavendra KJ", "Scientist (Agril. Economics)"],
    ["Dr. Vipin Kumar", "Chief Technical Officer"],
    ["Mrs. Himanshu Chauhan", "Senior Technical Officer"],
    ["Sh. Kirpa Shankar Pandey", "Skilled Supporting Staff"],
    ["Sh. Ayodhya Prasad Dubey", "Skilled Supporting Staff"],
  ],
};

const IIFSR_REPORTS = "https://iifsr.org.in/uploads/Annual_Reports/";

export const ANNUAL_REPORTS = {
  source: "https://iifsr.org.in/Institute-Annual-Reports.php",
  reports: [
    ["2024", "ICAR%20Annual%20Report%202024.pdf"],
    ["2022-2023", "ICAR%20Annual%20Report%202023.pdf"],
    ...[
      "2021-22",
      "2020-21",
      "2019-20",
      "2018-19",
      "2017-18",
      "2016-17",
      "2015-16",
      "2014-15",
      "2013-14",
      "2012-13",
      "2011-12",
      "2010-11",
      "2009-10",
    ].map((y) => [
      `20${y.slice(2, 4)}-20${y.slice(5)}`,
      `Annual_Report_for_the%20_year_${y}.pdf`,
    ]),
  ].map(([year, file]) => ({
    title: `Annual Report for the Year ${year}`,
    href: IIFSR_REPORTS + file,
  })),
};

export const KNOWLEDGE_PRODUCTS = {
  source: "https://nmnfresearch.in/",
  sourceName: "National Mission on Natural Farming",
  items: [
    [
      "Field Manual for Model Farms",
      "Field_Manual%20on%20NF_HQ_compressed.pdf",
    ],
    ["Research Bulletin", "NF_%20compendium_HQ_compressed.pdf"],
    [
      "Potential Domains",
      "NF_Potential%20Area_HQ_7%20September%202025_compressed.pdf",
    ],
    [
      "Field Manual for Extension Workers / Farmers",
      "NMNF_Field%20Manual_NF%20Summit_Final.pdf",
    ],
    ["QR Codes of Videos (NF Input Preparation)", "NF_Video_QR%20Codes.pdf"],
    [
      "General Fertilizer (Natural) Recommendation for Natural Farming",
      "gfr.pdf",
    ],
  ].map(([title, file]) => ({
    title,
    href: `https://nmnfresearch.in/${file}`,
  })),
};
