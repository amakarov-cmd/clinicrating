import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  ArrowsDownUp,
  CalendarCheck,
  CaretDown,
  Check,
  Clock,
  Minus,
  Question,
  X,
} from "@phosphor-icons/react";
import { allCities, allSubjects, citySubjects, clinics } from "./data/clinics";
import { ratingColumns, sortClinics } from "./data/ratingSort";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const russianServiceWords = [
  "из-за", "кроме", "между", "перед", "через", "чтобы", "потому", "поэтому",
  "без", "близ", "для", "под", "при", "про", "ради", "как", "что", "если",
  "когда", "пока", "хотя", "или", "либо", "во", "до", "за", "из", "ко", "на",
  "над", "об", "обо", "от", "по", "со", "не", "ни", "но", "да", "то", "бы",
  "же", "ли", "в", "к", "с", "у", "о", "и", "а",
];

const russianServiceWordPattern = new RegExp(
  `(^|[\\s([{«„"'])(${russianServiceWords.join("|")})\\s+`,
  "giu",
);

function preventHangingRussianWords(container) {
  if (!container) return;

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      if (parent.closest("script, style, textarea, input, select, option, code, pre, [contenteditable='true'], [data-typography-exception]")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    let formatted = node.nodeValue;
    for (let pass = 0; pass < 4; pass += 1) {
      formatted = formatted.replace(russianServiceWordPattern, "$1$2\u00A0");
    }
    if (formatted !== node.nodeValue) node.nodeValue = formatted;
  });
}

const tabs = [
  { id: "rating", label: "Рейтинг" },
  { id: "nominations", label: "Номинации" },
  { id: "market", label: "Рынок" },
];

// Временно скрывает блок с тремя лидерами. Поменять на true, чтобы вернуть его.
const showTopClinics = false;

const nominations = [
  {
    title: "Мгновенный фокус",
    description: "Быстрее других реагируют на заявки с сайта.",
    image: assetUrl("images/nominations/lightning.png"),
    overlay: "rgba(165, 190, 190, 0.78)",
    span: "lg:col-span-7",
    top: ["Глазная клиника 3Z — 4 мин.", "Омикрон — 4 мин.", "Центр офтальмохирургии «ИРИС» — 9 мин."],
    details: "Показывается топ-3 клиник с минимальным точным средним временем первого звонка. Порядок определяется по точному внутреннему времени, поэтому при одинаковом округлённом значении места могут отличаться.",
  },
  {
    title: "Без слепых зон",
    description: "Не оставляют заявки пациентов без обратной связи.",
    image: assetUrl("images/nominations/magnifier.png"),
    overlay: "rgba(198, 218, 213, 0.8)",
    span: "lg:col-span-5",
    top: ["Глазная клиника 3Z — 100%", "Омикрон — 100%", "Центр офтальмохирургии «ИРИС» — 100%"],
    details: "В номинацию входят только клиники со статусом: «По всем заявкам». Среди них топ-3 определяется по скорости первого звонка. Здесь допустимо использовать 100%, поскольку не раскрывается количество наблюдений.",
  },
  {
    title: "Запись в один клик",
    description: "Позволяют выбрать специалиста и время визита без звонка в клинику.",
    image: assetUrl("images/nominations/cursor.png"),
    overlay: "rgba(22, 38, 104, 0.82)",
    span: "lg:col-span-5",
    dark: true,
    top: ["Санта", "Смотри", "Косма"],
    details: "В номинацию входят только участники со статусом: «Полная онлайн-запись». Порядок — по итоговому рейтингу.",
  },
  {
    title: "Держат в фокусе",
    description: "Стабильно напоминают пациентам о предстоящем визите.",
    image: assetUrl("images/nominations/bell.png"),
    overlay: "rgba(50, 68, 115, 0.82)",
    span: "lg:col-span-7",
    dark: true,
    top: ["Омикрон", "Косма", "Центр охраны зрения"],
    details: "В номинацию входят клиники, у которых напоминание подтверждено во всех доступных наблюдениях. Порядок — по итоговому рейтингу.",
  },
  {
    title: "Не теряют из виду",
    description: "Продолжают работать с пациентом даже после отмены записи.",
    image: assetUrl("images/nominations/return.png"),
    overlay: "rgba(125, 120, 130, 0.82)",
    span: "lg:col-span-7",
    dark: true,
    top: ["ЛЕНАР", "Факт", "Центр Коновалова"],
    details: "В номинацию входят клиники, у которых взаимодействие после отмены стабильно подтверждено.",
  },
  {
    title: "Двойной фокус",
    description: "Используют сразу два канала напоминания о визите.",
    image: assetUrl("images/nominations/phone.png"),
    overlay: "rgba(170, 165, 190, 0.8)",
    span: "lg:col-span-5",
    top: ["САДКО.ВИЖУ", "Реал Вижн", "Визион"],
    details: "Критерий: звонок + сообщение.",
  },
];

const marketCards = [
  {
    value: "8 ч. 58 мин.",
    title: "До первого контакта",
    text: "Столько в среднем проходит от заявки на сайте до первого звонка клиники. Лучшие участники реагируют за несколько минут, но средний показатель рынка сильно растёт из-за долгих ответов и обращений, оставшихся без связи.",
    tone: "bg-[#130F33] text-white",
  },
  {
    value: "≈35%",
    title: "Заявок остаются без звонка",
    text: "Примерно каждое третье валидное онлайн-обращение не получает звонка клиники в течение 24 часов. Наличие формы на сайте ещё не означает, что заявка будет обработана.",
    tone: "bg-[#A5BEBE] text-[#130F33]",
  },
  {
    value: "71%",
    title: "Без полноценной онлайн-записи",
    text: "У большинства клиник пациент по-прежнему не может самостоятельно выбрать специалиста и свободный слот. Часто «онлайн-запись» фактически оказывается формой обратного звонка.",
    tone: "bg-[#162668] text-white",
  },
  {
    value: "90%",
    title: "Не подтверждают запись стабильно",
    text: "Только небольшая часть клиник стабильно отправляет автоматическое подтверждение записи. Для большинства пациентов после записи цифровой сценарий остаётся неполным.",
    tone: "bg-[#C6DAD5] text-[#130F33]",
  },
  {
    value: "66%",
    title: "Напоминают о визите",
    text: "Около двух третей клиник хотя бы в части проверок напоминали пациенту о предстоящем приёме звонком или сообщением. Единый стандарт коммуникации при этом есть далеко не у всех.",
    tone: "bg-[#6D7E80] text-white",
  },
  {
    value: "68%",
    title: "Не возвращают после отмены",
    text: "Большинство клиник прекращает коммуникацию после отмены визита. Новую дату, услугу или другое предложение после отмены предлагают только отдельные участники рынка.",
    tone: "bg-[#AAA5BE] text-[#130F33]",
  },
  {
    value: "89%",
    title: "Подтверждают успешную отправку заявки",
    text: "Большинство сайтов клиник использует экраны и попапы с благодарностью за оставление заявки. Эти элементы нужны, чтобы пользователь был уверен, что его обращение зафиксировано.",
    tone: "bg-[#130F33] text-white",
  },
  {
    value: "94%",
    title: "Фиксируют цель отправки заявки",
    text: "Параметр зафиксирован среди доступных для проверки случаев. Отправка цели в Яндекс Метрики показывает, что на сайте клиники настроена базовая веб-аналитика, которая нужна для правильной оценки вкладов различных digital-каналов в маркетинг клиники.",
    tone: "bg-[#C6DAD5] text-[#130F33]",
  },
];

function FilterCombobox({ label, value, onChange, options, allLabel }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const listId = useId();
  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ru");
    if (!normalized || normalized === allLabel.toLocaleLowerCase("ru")) return options;
    return options.filter((item) => item.toLocaleLowerCase("ru").includes(normalized));
  }, [allLabel, options, query]);

  useEffect(() => setQuery(value), [value]);

  const select = (value) => {
    onChange(value);
    setQuery(value);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label htmlFor={listId} className="mb-2 block text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          id={listId}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (!event.target.value) onChange(allLabel);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && matches[0]) select(matches[0]);
          }}
          autoComplete="off"
          aria-expanded={open}
          aria-controls={`${listId}-options`}
          role="combobox"
          className="focus-ring h-14 w-full border border-[#130F33]/25 bg-white px-4 pr-12 text-base outline-none transition-colors focus:border-[#162668]"
          placeholder={allLabel}
        />
        {value !== allLabel || query ? (
          <button type="button" aria-label={`Сбросить: ${label.toLocaleLowerCase("ru")}`} onClick={() => select(allLabel)} className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 p-2"><X size={18} /></button>
        ) : <CaretDown className="absolute right-5 top-1/2 -translate-y-1/2" size={18} />}
      </div>
      {open && (
        <div id={`${listId}-options`} role="listbox" className="absolute z-[100] mt-1 max-h-72 w-full overflow-auto border border-[#130F33] bg-white shadow-[10px_10px_0_#130F33]">
          <button type="button" role="option" aria-selected={value === allLabel} onMouseDown={(event) => event.preventDefault()} onClick={() => select(allLabel)} className="focus-ring flex w-full items-center justify-between border-b border-[#130F33]/15 px-4 py-3 text-left hover:bg-[#C6DAD5]">{allLabel} {value === allLabel && <Check size={18} />}</button>
          {matches.map((item) => (
            <button key={item} type="button" role="option" aria-selected={value === item} onMouseDown={(event) => event.preventDefault()} onClick={() => select(item)} className="focus-ring flex w-full items-center justify-between border-b border-[#130F33]/15 px-4 py-3 text-left last:border-b-0 hover:bg-[#C6DAD5]">{item} {value === item && <Check size={18} />}</button>
          ))}
          {matches.length === 0 && <div className="px-4 py-4 text-sm text-[#6D7E80]">Ничего не найдено</div>}
        </div>
      )}
    </div>
  );
}

function Status({ value }) {
  const positive = value === "Да" || value === "Полная" || value === "По всем заявкам";
  const partial = value === "Частично" || value === "В большинстве случаев";
  const Icon = positive ? Check : partial ? Minus : value === "Нет данных" ? Question : X;
  const color = positive ? "text-[#162668]" : partial ? "text-[#7D7882]" : "text-[#6D7E80]";
  return <span className={`inline-flex items-center gap-2 whitespace-nowrap text-sm ${color}`}><Icon size={16} weight="bold" />{value}</span>;
}

function TopClinics() {
  const section = useRef(null);
  const track = useRef(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const slides = gsap.utils.toArray(".top-clinic-slide");
    const media = gsap.matchMedia();

    media.add("(min-width: 768px)", () => {
      const travel = () => Math.max(0, track.current.scrollWidth - section.current.clientWidth);
      const horizontal = gsap.to(track.current, {
        x: () => -travel(),
        ease: "none",
        scrollTrigger: {
          trigger: section.current,
          start: "top top+=65",
          end: () => `+=${travel()}`,
          pin: true,
          scrub: 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      slides.forEach((slide, index) => {
        const title = slide.querySelector(".top-clinic-title");
        const trophy = slide.querySelector(".top-clinic-trophy");
        const details = slide.querySelector(".top-clinic-details");

        if (index === 0) {
          gsap.timeline({ scrollTrigger: { trigger: section.current, start: "top 78%" }, defaults: { ease: "power3.out" } })
            .from(title, { y: 36, opacity: 0, clipPath: "inset(0 0 100% 0)", duration: 0.85 })
            .from(trophy, { y: 30, scale: 0.86, opacity: 0, duration: 1 }, "-=0.48")
            .from(details, { y: 24, opacity: 0, duration: 0.7 }, "-=0.52");
          return;
        }

        gsap.fromTo(title, { y: 58, opacity: 0, clipPath: "inset(0 0 100% 0)" }, {
          y: 0,
          opacity: 1,
          clipPath: "inset(0 0 0% 0)",
          ease: "none",
          scrollTrigger: { trigger: slide, containerAnimation: horizontal, start: "left 82%", end: "left 48%", scrub: 0.55 },
        });
        gsap.fromTo(trophy, { x: 72, y: 22, scale: 0.78, rotate: index === 1 ? -6 : 6, opacity: 0 }, {
          x: 0,
          y: 0,
          scale: 1,
          rotate: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: slide, containerAnimation: horizontal, start: "left 80%", end: "left 43%", scrub: 0.65 },
        });
        gsap.fromTo(details, { y: 34, opacity: 0 }, {
          y: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: slide, containerAnimation: horizontal, start: "left 69%", end: "left 38%", scrub: 0.5 },
        });
      });

      return () => {
        horizontal.scrollTrigger?.kill();
        horizontal.kill();
      };
    });

    media.add("(max-width: 767px)", () => {
      gsap.set(track.current, { position: "relative", height: "calc(100dvh - 65px)", x: 0 });
      gsap.set(slides, { position: "absolute", inset: 0, width: "100%", height: "100%", autoAlpha: 0, xPercent: 0 });
      gsap.set(slides[0], { autoAlpha: 1, zIndex: 1 });

      const sequence = gsap.timeline({
        scrollTrigger: {
          trigger: section.current,
          start: "top top+=65",
          end: () => `+=${window.innerHeight * 2.35}`,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      slides.slice(1).forEach((slide, index) => {
        const previous = slides[index];
        sequence
          .to(previous, { autoAlpha: 0, xPercent: -7, duration: 0.18, ease: "power2.in" })
          .set(previous, { zIndex: 0 })
          .set(slide, { zIndex: index + 2, xPercent: 7 })
          .to(slide, { autoAlpha: 1, xPercent: 0, duration: 0.26, ease: "power2.out" })
          .to(slide, { opacity: 1, duration: 0.56 });
      });

      return () => {
        sequence.scrollTrigger?.kill();
        sequence.kill();
      };
    });

    return () => media.revert();
  }, { scope: section });

  return (
    <section ref={section} aria-label="Три лидера рейтинга" className="top-clinics-horizontal relative mt-12 overflow-hidden border-y border-[#130F33]/15 bg-white">
      <div ref={track} className="top-clinics-track relative flex w-full will-change-transform">
        {clinics.slice(0, 3).map((clinic, index) => (
          <article key={clinic.rank} className="top-clinic-slide relative flex h-[calc(100dvh-65px)] min-h-0 w-full shrink-0 items-center justify-center overflow-hidden bg-white px-4 py-6 text-center sm:px-8 sm:py-8 lg:px-12">
            <div className="relative flex h-full min-h-0 w-full max-w-[1220px] flex-col items-center justify-center md:justify-start">
              <div className="flex w-full shrink-0 items-center gap-4 text-[11px] uppercase tracking-[0.12em] text-[#6D7E80] sm:text-xs">
                <span className="tabular-nums">0{clinic.rank}</span>
                <span className="h-px flex-1 bg-[#130F33]/15" />
                <span>Топ-3 рейтинга</span>
              </div>

              <h3 className={`top-clinic-title mt-5 max-w-[1180px] shrink-0 font-medium leading-[0.92] tracking-[-0.05em] text-[#130F33] sm:mt-7 ${index === 2 ? "text-[clamp(2rem,9vw,4rem)] md:text-[clamp(2.25rem,5.4vw,6rem)]" : "text-[clamp(2.25rem,10vw,4.75rem)] md:text-[clamp(3.4rem,7vw,7.8rem)]"}`}>{clinic.name}</h3>

              <div className="top-clinic-trophy relative -mt-1 aspect-[1254/815] w-[min(36rem,86vw,54vh)] shrink-0 overflow-hidden sm:-mt-2 md:w-[min(54rem,72vw,68vh)] lg:w-[min(54rem,62vw,74vh)]">
                <img src={assetUrl(`images/trophy-place-${clinic.rank}.png`)} alt={`Кубок: ${clinic.rank} место`} className="top-clinic-trophy-image absolute inset-x-0 top-0 h-auto w-full object-contain" loading={index === 0 ? "eager" : "lazy"} />
              </div>

              <div className="top-clinic-details mt-1 grid w-full shrink-0 grid-cols-3 border-t border-[#130F33]/20 pt-4 text-left sm:mt-2 sm:pt-6 md:mt-auto">
                <div className="pr-3 sm:pr-6"><div className="text-[10px] leading-tight text-[#6D7E80] sm:text-xs">Среднее время до первого звонка</div><div className="mt-2 text-2xl tracking-[-0.04em] tabular-nums sm:text-4xl">{clinic.avgTime}</div></div>
                <div className="border-l border-[#130F33]/15 px-3 sm:px-6"><div className="text-[10px] leading-tight text-[#6D7E80] sm:text-xs">Перезвон по заявкам</div><div className="mt-2 text-xs font-medium leading-tight sm:text-base">{clinic.callbacks}</div></div>
                <div className="border-l border-[#130F33]/15 pl-3 sm:pl-6"><div className="text-[10px] leading-tight text-[#6D7E80] sm:text-xs">Онлайн-запись</div><div className="mt-2 text-xs font-medium leading-tight sm:text-base">{clinic.onlineBooking}</div></div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function RatingTable() {
  const tableRoot = useRef(null);
  const [city, setCity] = useState("Все города");
  const [subject, setSubject] = useState("Все субъекты");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [sort, setSort] = useState({ key: "rank", direction: "ascending" });

  const filtered = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("ru");
    return clinics.filter((clinic) => {
      const matchesCity = city === "Все города" || clinic.cities.includes(city);
      const matchesSubject = subject === "Все субъекты" || clinic.cities.some((clinicCity) => citySubjects[clinicCity] === subject);
      const matchesName = !normalized || clinic.name.toLocaleLowerCase("ru").includes(normalized);
      return matchesCity && matchesSubject && matchesName;
    });
  }, [city, search, subject]);

  useEffect(() => setShowAll(city !== "Все города" || subject !== "Все субъекты" || Boolean(search)), [city, search, subject]);
  const sorted = useMemo(() => sortClinics(filtered, sort.key, sort.direction), [filtered, sort]);
  const visible = showAll ? sorted : sorted.slice(0, 15);

  const toggleSort = (key) => {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(".rating-row", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.025, ease: "power2.out", clearProps: "transform" });
  }, { scope: tableRoot, dependencies: [city, search, subject, showAll] });

  return (
    <div ref={tableRoot} className="mt-10">
      <div className="relative z-50 grid grid-flow-dense grid-cols-1 gap-px bg-[#130F33]/20 lg:grid-cols-12">
        <div className="bg-[#A5BEBE] p-6 lg:col-span-4 lg:p-8"><FilterCombobox label="Субъект" value={subject} onChange={setSubject} options={allSubjects} allLabel="Все субъекты" /></div>
        <div className="bg-[#C6DAD5] p-6 lg:col-span-4 lg:p-8"><FilterCombobox label="Город" value={city} onChange={setCity} options={allCities} allLabel="Все города" /></div>
        <div className="bg-[#C6DAD5] p-6 lg:col-span-4 lg:p-8">
          <label htmlFor="clinic-search" className="mb-2 block text-sm font-medium">Поиск по клинике</label>
          <div className="relative">
            <input id="clinic-search" value={search} onChange={(event) => setSearch(event.target.value)} className="focus-ring h-14 w-full border border-[#130F33]/25 bg-white px-4 pr-12 outline-none transition-colors focus:border-[#162668]" placeholder="Название сети" />
            {search && <button type="button" aria-label="Очистить поиск" onClick={() => setSearch("")} className="focus-ring absolute right-3 top-1/2 -translate-y-1/2 p-2"><X size={18} /></button>}
          </div>
        </div>
        <div className="bg-[#130F33] p-6 text-white lg:col-span-4 lg:p-8">
          <div className="tabular-nums text-4xl lg:text-5xl">{filtered.length}</div>
          <div className="mt-3 text-sm text-white/70">сетей соответствует условиям</div>
        </div>
        <div className="bg-white p-6 lg:col-span-4 lg:p-8">
          <p className="m-0 text-sm leading-relaxed">Фильтры показывают все сети рейтинга, соответствующие выбранным городу и субъекту.</p>
        </div>
        <div className="bg-white p-6 lg:col-span-4 lg:p-8">
          <p className="m-0 text-sm leading-relaxed">Результаты относятся к сети в целом и могут быть получены на основании проверки другого филиала.</p>
        </div>
      </div>

      <div className="scrollbar-thin mt-8 overflow-x-auto border-y border-[#130F33]">
        <table className="rating-table w-full min-w-[1660px] text-left">
          <colgroup>
            <col className="w-[88px]" />
            <col className="w-[250px]" />
            <col className="w-[110px]" />
            <col className="w-[220px]" />
            <col className="w-[125px]" />
            <col className="w-[140px]" />
            <col className="w-[115px]" />
            <col className="w-[155px]" />
            <col className="w-[145px]" />
            <col className="w-[145px]" />
            <col className="w-[167px]" />
          </colgroup>
          <thead className="bg-[#130F33] text-white">
            <tr className="text-[11px] font-medium leading-[1.2] tracking-[0.01em]">
              {ratingColumns.map((column, index) => {
                const selected = sort.key === column.key;
                const SortIcon = selected ? (sort.direction === "ascending" ? ArrowUp : ArrowDown) : ArrowsDownUp;
                const nextDirection = selected && sort.direction === "ascending" ? "убыванию" : "возрастанию";
                return (
                  <th key={column.key} scope="col" aria-sort={selected ? sort.direction : "none"} className={`border-b border-r border-white/15 bg-[#130F33] align-middle last:border-r-0 ${index === 0 ? "rating-pinned-cell w-[88px] min-w-[88px] max-w-[88px] md:sticky md:left-0 md:z-40" : index === 1 ? "rating-pinned-cell rating-pinned-edge w-[250px] min-w-[250px] max-w-[250px] md:sticky md:left-[88px] md:z-40" : ""}`}>
                    <button type="button" onClick={() => toggleSort(column.key)} aria-label={`${column.label}: сортировать по ${nextDirection}`} title={`Сортировать по ${nextDirection}`} className="rating-sort-button w-full px-3 py-3 text-left transition-colors hover:bg-white/10">
                      <span>{column.key === "autoConfirmation" ? <>Автоподтверждение<br />записи</> : column.label}</span>
                      <SortIcon size={12} aria-hidden="true" className={`ml-1 inline-block align-middle ${selected ? "opacity-100" : "opacity-45"}`} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((clinic) => {
              const isOpen = expanded === clinic.rank;
              return (
                <Fragment key={clinic.rank}>
                  <tr key={clinic.rank} className="rating-row group transition-colors hover:bg-[#C6DAD5]/50">
                    <td className="rating-pinned-cell w-[88px] min-w-[88px] max-w-[88px] bg-white px-3 py-3 align-middle text-xl leading-none tabular-nums transition-colors group-hover:bg-[#E6F0ED] md:sticky md:left-0 md:z-20">{String(clinic.rank).padStart(2, "0")}</td>
                    <td className="rating-pinned-cell rating-pinned-edge w-[250px] min-w-[250px] max-w-[250px] bg-white px-3 py-3 align-middle transition-colors group-hover:bg-[#E6F0ED] md:sticky md:left-[88px] md:z-20">
                      <button type="button" onClick={() => setExpanded(isOpen ? null : clinic.rank)} className="focus-ring flex w-full items-center justify-between gap-3 text-left text-sm font-medium leading-[1.25]">
                        <span>{clinic.name}</span><CaretDown size={18} className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                      </button>
                    </td>
                    <td className="px-3 py-3 align-middle"><div className="text-lg leading-none tabular-nums">{clinic.avgTime}</div><div className="mt-1 text-xs text-[#6D7E80]">{clinic.avgMinutes} мин.</div></td>
                    <td className="px-3 py-3 align-middle"><Status value={clinic.callbacks} /></td>
                    <td className="px-3 py-3 align-middle"><Status value={clinic.onlineBooking} /></td>
                    <td className="px-3 py-3 align-middle"><Status value={clinic.metrikaGoal} /></td>
                    <td className="px-3 py-3 align-middle"><Status value={clinic.thankYou} /></td>
                    <td className="px-3 py-3 align-middle"><Status value={clinic.autoConfirmation} /></td>
                    <td className="px-3 py-3 align-middle"><Status value={clinic.reminder} /></td>
                    <td className="px-3 py-3 align-middle text-sm leading-[1.25]">{clinic.reminderChannels}</td>
                    <td className="px-3 py-3 align-middle"><Status value={clinic.afterCancellation} /></td>
                  </tr>
                  {isOpen && (
                    <tr key={`${clinic.rank}-detail`} className="rating-detail-row bg-[#C6DAD5]">
                      <td colSpan="11" className="px-4 py-6">
                        <div className="grid gap-6 lg:grid-cols-[180px_1fr_1fr]">
                          <div className="text-sm font-medium">Города присутствия</div>
                          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">{clinic.cities.map((item) => <span key={item}>{item}</span>)}</div>
                          <div className="text-sm text-[#130F33]/70">Показатели остаются общесетевыми. Фильтрация по городу не означает, что конкретный филиал в этом городе исследовался отдельно.</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="border-b border-[#130F33] py-16 text-center text-lg">По заданным условиям клиники не найдены.</div>}
      {!showAll && filtered.length > 15 && (
        <div className="mt-8 flex justify-center"><button type="button" onClick={() => setShowAll(true)} className="focus-ring group flex items-center gap-4 border border-[#130F33] bg-white px-7 py-4 font-medium transition-colors hover:bg-[#130F33] hover:text-white">Показать все {filtered.length} <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} /></button></div>
      )}
    </div>
  );
}

function Nominations() {
  return (
    <div className="nomination-section">
      <div className="mb-10 max-w-3xl lg:mb-14">
        <h2 className="text-[clamp(2.7rem,5vw,5.7rem)] font-medium leading-[0.95] tracking-[-0.045em]">Номинации</h2>
        <p className="mt-7 text-lg leading-relaxed">Номинации — отдельные мини-рейтинги, позволяющие показать сильные стороны участников вне основного итогового места.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
        {nominations.map((item, index) => {
          const tone = index % 3 === 0 ? "nomination-card-ink text-white" : index % 3 === 1 ? "nomination-card-mint text-[#130F33]" : "nomination-card-ice text-[#130F33]";
          return (
            <article
              key={item.title}
              className={`nomination-card group relative min-h-[500px] overflow-hidden text-left ${item.span} ${tone}`}
            >
              <div className="nomination-surface pointer-events-none absolute inset-0 z-0" />
              <img
                src={item.image}
                alt=""
                aria-hidden="true"
                className="nomination-object pointer-events-none absolute z-[1] object-contain object-right-bottom"
                loading="lazy"
              />
              <div className="relative z-[3] flex min-h-[500px] flex-col justify-center p-7 lg:p-9">
                <h3 className="max-w-[19rem] text-3xl font-medium tracking-[-0.03em] lg:text-[2.1rem]">{item.title}</h3>
                <p className="mt-4 max-w-[22rem] leading-relaxed opacity-90">{item.description}</p>
                <ol className="nomination-ranking mt-9 max-w-[34rem] space-y-3">
                  {item.top.map((entry, rank) => <li key={entry} className="grid grid-cols-[24px_1fr] gap-3 text-sm"><span className="tabular-nums opacity-60">{rank + 1}</span><span>{entry}</span></li>)}
                </ol>
                <p className="mt-7 max-w-[38rem] text-sm leading-relaxed opacity-85">{item.details}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Market() {
  const section = useRef(null);
  const viewport = useRef(null);
  const nextFade = useRef(null);
  const drag = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });

  useGSAP(() => {
    const cards = gsap.utils.toArray(".market-gallery-card");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || !cards.length) return undefined;

    gsap.from(cards, {
      y: 28,
      opacity: 0,
      duration: 0.72,
      stagger: 0.07,
      ease: "power3.out",
      clearProps: "transform,opacity",
      scrollTrigger: { trigger: section.current, start: "top 76%", once: true },
    });
  }, { scope: section });

  useEffect(() => {
    const scroller = viewport.current;
    const fade = nextFade.current;
    if (!scroller || !fade) return undefined;
    const shell = scroller.parentElement;

    const updateFade = () => {
      const remaining = scroller.scrollWidth - scroller.clientWidth - scroller.scrollLeft;
      fade.toggleAttribute("data-hidden", remaining < 4);
    };

    const handleWheel = (event) => {
      const rawDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      const delta = event.deltaMode === 1 ? rawDelta * 18 : rawDelta;
      if (!delta) return;

      const canMoveForward = delta > 0 && scroller.scrollLeft < scroller.scrollWidth - scroller.clientWidth - 2;
      const canMoveBack = delta < 0 && scroller.scrollLeft > 2;
      if (!canMoveForward && !canMoveBack) return;

      event.preventDefault();
      scroller.scrollLeft += delta;
    };

    shell.addEventListener("wheel", handleWheel, { passive: false });
    scroller.addEventListener("scroll", updateFade, { passive: true });
    updateFade();

    return () => {
      shell.removeEventListener("wheel", handleWheel);
      scroller.removeEventListener("scroll", updateFade);
    };
  }, []);

  const scrollToNext = () => {
    const scroller = viewport.current;
    if (!scroller) return;
    const card = scroller.querySelector(".market-gallery-card");
    const gap = Number.parseFloat(getComputedStyle(scroller).columnGap) || 16;
    scroller.scrollBy({ left: (card?.getBoundingClientRect().width || scroller.clientWidth * 0.44) + gap, behavior: "smooth" });
  };

  const startDrag = (event) => {
    if (event.pointerType === "touch" || event.button !== 0) return;
    const scroller = viewport.current;
    drag.current = { active: true, moved: false, startX: event.clientX, scrollLeft: scroller.scrollLeft };
    scroller.setPointerCapture(event.pointerId);
    scroller.classList.add("is-dragging");
  };

  const moveDrag = (event) => {
    if (!drag.current.active) return;
    const distance = event.clientX - drag.current.startX;
    if (Math.abs(distance) > 4) drag.current.moved = true;
    viewport.current.scrollLeft = drag.current.scrollLeft - distance;
  };

  const stopDrag = (event) => {
    const scroller = viewport.current;
    if (!drag.current.active || !scroller) return;
    drag.current.active = false;
    scroller.classList.remove("is-dragging");
    if (scroller.hasPointerCapture(event.pointerId)) scroller.releasePointerCapture(event.pointerId);
  };

  const renderCard = (card, index) => {
    const tone = index % 3 === 0 ? "market-card-ink" : index % 3 === 1 ? "market-card-mint" : "market-card-ice";
    return (
      <article key={card.value} className={`market-card-unified market-gallery-card group h-full min-h-0 overflow-hidden p-7 lg:p-8 ${tone}`}>
        <div className="market-card-content relative z-[1] flex h-full flex-col">
          <div className="market-card-value leading-none tracking-[-0.055em] tabular-nums transition-transform duration-700 ease-out group-hover:-translate-y-1">{card.value}</div>
          <div className="market-card-copy-wrap mt-auto max-w-2xl border-t border-current/25"><h3 className="market-card-title font-medium leading-tight">{card.title}</h3><p className="market-card-copy opacity-80">{card.text}</p></div>
        </div>
      </article>
    );
  };

  return (
    <div ref={section} className="market-section">
      <section className="pb-4">
        <h2 className="text-[clamp(2.7rem,5vw,5.7rem)] font-medium leading-[0.95] tracking-[-0.045em]">Что происходит на рынке</h2>
        <div className="market-gallery-shell relative mt-8">
          <div
            ref={viewport}
            className="market-gallery flex h-[clamp(330px,48dvh,540px)] gap-4 overflow-x-auto overflow-y-hidden"
            aria-label="Показатели рынка"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
            onClickCapture={(event) => {
              if (drag.current.moved) {
                event.preventDefault();
                event.stopPropagation();
                drag.current.moved = false;
              }
            }}
          >
            {marketCards.map(renderCard)}
          </div>
          <button ref={nextFade} type="button" onClick={scrollToNext} className="market-gallery-next focus-ring absolute inset-y-0 right-0 z-[2]" aria-label="Показать следующую карточку">
            <span className="market-gallery-next-icon" aria-hidden="true"><ArrowRight size={22} /></span>
          </button>
        </div>
        <p className="market-footnote mt-5 w-full max-w-4xl border-t border-[#130F33]/15 pt-4 text-sm leading-relaxed text-[#6D7E80]">Все показатели рассчитаны среди участников исследования III квартала 2026 года. Исследование не является статистической переписью всех офтальмологических клиник России.</p>
      </section>
    </div>
  );
}

function Methodology() {
  return (
    <section id="methodology" className="bg-[#130F33] py-16 text-white lg:py-20">
      <div className="mx-auto grid max-w-[1500px] gap-10 px-5 md:px-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)] lg:gap-14">
        <div className="methodology-title h-fit lg:sticky lg:top-20">
          <h2 data-typography-exception className="max-w-xl text-[clamp(3rem,5vw,6.25rem)] font-medium leading-[0.93] tracking-[-0.055em]">
            <span className="block">Как</span>
            <span className="block">проводилось</span>
            <span className="block">исследование</span>
          </h2>
        </div>
        <div className="methodology-copy divide-y divide-white/20 border-y border-white/20 text-lg leading-[1.65] text-white/85 lg:text-xl">
          <p className="methodology-paragraph py-7 lg:py-8">Исследование проводилось в <strong>III квартале 2026 года</strong> среди офтальмологических клиник и сетей из разных городов России. Участники отбирались из открытых отраслевых подборок и дополнялись вручную в ходе анализа рынка.</p>
          <p className="methodology-paragraph py-7 lg:py-8">Специалисты проходили путь обычного пациента: оставляли заявки на сайтах клиник, оценивали возможность онлайн-записи, скорость и стабильность обратного звонка, подтверждение заявки и записи, напоминания о визите и коммуникацию после отмены. Для каждой сети проводилось несколько независимых проверок, а в рейтинг вошли только агрегированные результаты.</p>
          <p className="methodology-paragraph py-7 lg:py-8">Основной критерий — <strong>среднее время до первого звонка</strong>. Если клиника не связывалась в течение 24 часов, в расчёте учитывались 24 часа. Технически несостоявшиеся проверки исключались. При близких результатах учитывались стабильность перезвона и остальные этапы клиентского пути. <strong>Балльная система не используется.</strong></p>
          <p className="methodology-paragraph py-7 lg:py-8">Филиалы одной сети объединяются в одного участника. Фильтр по городам показывает все города присутствия сети, даже если исследование проводилось в другом филиале. Рейтинг оценивает <strong>работу с онлайн-заявками и цифровой клиентский путь</strong>, а не качество лечения или работу врачей.</p>
        </div>
      </div>
    </section>
  );
}

function HeroCopy({ inverse = false }) {
  const fixedLayer = inverse ? "invisible" : "";

  return (
    <div className={`hero-copy w-full max-w-[760px] min-w-0 ${inverse ? "pointer-events-none" : "pointer-events-auto"}`}>
      <div className={`hero-meta flex max-w-[760px] flex-wrap items-center justify-between gap-4 border-y border-[#130F33]/20 py-4 text-sm text-[#324473] ${fixedLayer}`}>
        <strong className="font-medium text-[#130F33]">III квартал 2026 года</strong>
        <span>Подготовлено агентством диджитал-маркетинга Реаспект</span>
      </div>
      <h1 className={`${inverse ? "hero-title-inverse text-white" : "hero-title text-[#130F33]"} mt-8 max-w-[760px] text-[clamp(2rem,4.25vw,4.75rem)] font-medium leading-[0.94] tracking-[-0.052em] lg:mt-12`}>Рейтинг офтальмологических клиник по работе с онлайн-заявками</h1>
      <div aria-label="Кратко об исследовании. Проведите пальцем, чтобы увидеть следующую карточку" className={`${inverse ? "hero-description-inverse invisible" : "hero-description text-[#130F33]"} mt-8 grid max-w-[680px] gap-3 text-lg leading-relaxed lg:mt-10 lg:grid-cols-2`}>
        <p className="hero-frost-panel p-5 lg:p-6">Проверили клиентский путь в офтальмологических клиниках России: от заявки на сайте и первого звонка до записи, напоминания о визите и повторного контакта после отмены.</p>
        <p className="hero-frost-panel p-5 lg:p-6">Рейтинг оценивает не качество лечения или работу врачей, а то, насколько удобно, быстро и последовательно клиника работает с пациентом на цифровом этапе.</p>
      </div>
      <a href="#study" tabIndex={inverse ? -1 : undefined} className={`hero-cta focus-ring group mt-8 inline-flex items-center gap-4 bg-[#130F33] px-7 py-4 font-medium text-white transition-colors hover:bg-[#162668] lg:mt-10 ${fixedLayer}`}>Перейти к результатам <ArrowDown className="transition-transform group-hover:translate-y-1" size={20} /></a>
    </div>
  );
}

function App() {
  const root = useRef(null);
  const heroVisual = useRef(null);
  const contactVisual = useRef(null);
  const studyTabsStart = useRef(null);
  const studyNav = useRef(null);
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace("#", "");
    return tabs.some((tab) => tab.id === hash) ? hash : "rating";
  });

  useLayoutEffect(() => {
    const container = root.current;
    if (!container) return undefined;

    preventHangingRussianWords(container);
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.addedNodes.length > 0)) {
        preventHangingRussianWords(container);
      }
    });
    observer.observe(container, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = studyTabsStart.current;
    const nav = studyNav.current;
    if (!container || !nav) return undefined;
    const sections = tabs.map(({ id }) => document.getElementById(id));
    let frame = 0;
    let refreshFrame = 0;

    const updateActiveSection = () => {
      frame = 0;
      const threshold = nav.offsetHeight + 2;
      let current = tabs[0].id;
      sections.forEach((section, index) => {
        if (section.getBoundingClientRect().top <= threshold) current = tabs[index].id;
      });
      setActiveTab(current);
    };
    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(updateActiveSection);
    };
    const syncHash = () => {
      const id = window.location.hash.slice(1);
      const section = sections.find((item) => item.id === id);
      if (!section) return;
      window.scrollTo({
        top: Math.max(0, section.getBoundingClientRect().top + window.scrollY - nav.offsetHeight),
        behavior: "instant",
      });
      scheduleUpdate();
    };
    // Filters, expanded rows and fonts can change the height of earlier sections.
    const resizeObserver = new ResizeObserver(() => {
      container.style.setProperty("--study-nav-height", `${nav.offsetHeight}px`);
      scheduleUpdate();
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    resizeObserver.observe(nav);
    sections.forEach((section) => resizeObserver.observe(section));
    container.style.setProperty("--study-nav-height", `${nav.offsetHeight}px`);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("hashchange", syncHash);
    const initialFrame = requestAnimationFrame(syncHash);
    scheduleUpdate();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("hashchange", syncHash);
      cancelAnimationFrame(initialFrame);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(refreshFrame);
    };
  }, []);

  const switchTab = (id) => {
    const section = document.getElementById(id);
    if (!section) return;
    setActiveTab(id);
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({
      top: Math.max(0, section.getBoundingClientRect().top + window.scrollY - (studyNav.current?.offsetHeight || 0)),
      behavior: "instant",
    });
  };

  const moveHeroReveal = (event) => {
    const visual = heroVisual.current;
    if (!visual || event.pointerType === "touch") return;

    const rect = visual.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));

    visual.style.setProperty("--hero-reveal-x", `${x}px`);
    visual.style.setProperty("--hero-reveal-y", `${y}px`);
    visual.style.setProperty("--hero-reveal-opacity", "1");
  };

  const hideHeroReveal = () => {
    heroVisual.current?.style.setProperty("--hero-reveal-opacity", "0");
  };

  const moveContactReveal = (event) => {
    const visual = contactVisual.current;
    if (!visual || event.pointerType === "touch") return;

    const rect = visual.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));

    visual.style.setProperty("--contact-reveal-x", `${x}px`);
    visual.style.setProperty("--contact-reveal-y", `${y}px`);
    visual.style.setProperty("--contact-reveal-opacity", "1");
  };

  const hideContactReveal = () => {
    contactVisual.current?.style.setProperty("--contact-reveal-opacity", "0");
  };

  useGSAP(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const heroTimeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    heroTimeline
      .from(".hero-logo", { y: 24, opacity: 0, duration: 0.8 })
      .from(".hero-meta", { y: 20, opacity: 0, duration: 0.7 }, "-=0.5")
      .from([".hero-title", ".hero-title-inverse"], { y: 46, opacity: 0, clipPath: "inset(0 0 100% 0)", duration: 1.05 }, "-=0.35")
      .from([".hero-description", ".hero-description-inverse"], { y: 26, opacity: 0, duration: 0.75 }, "-=0.45")
      .from(".hero-cta", { y: 26, opacity: 0, duration: 0.75 }, "-=0.63");
    gsap.from(".hero-photo", { opacity: 0, duration: 1.5, ease: "power2.out" });
    gsap.utils.toArray(".reveal-heading").forEach((item) => gsap.from(item, { scrollTrigger: { trigger: item, start: "top 82%" }, y: 55, opacity: 0, duration: 0.9, ease: "power3.out" }));
    gsap.utils.toArray(".methodology-paragraph").forEach((paragraph) => gsap.fromTo(paragraph, { opacity: 0.28, x: 22 }, { opacity: 1, x: 0, ease: "none", scrollTrigger: { trigger: paragraph, start: "top 82%", end: "top 52%", scrub: 0.7 } }));
    const contactTimeline = gsap.timeline({
      defaults: { ease: "power3.out" },
      scrollTrigger: { trigger: "#contact", start: "top 78%", once: true },
    });
    contactTimeline
      .from(".contact-visual", { opacity: 0, scale: 1.035, duration: 1.25, transformOrigin: "left center" })
      .from(".contact-heading", { y: 48, opacity: 0, clipPath: "inset(0 0 100% 0)", duration: 0.95 }, "-=0.72")
      .from(".contact-lead", { y: 26, opacity: 0, duration: 0.72 }, "-=0.5")
      .from(".contact-glass", { y: 30, opacity: 0, scale: 0.985, duration: 0.8 }, "-=0.44")
      .from(".contact-actions", { y: 26, opacity: 0, duration: 0.72 }, "-=0.52");
  }, { scope: root });

  return (
    <main ref={root} className="w-full max-w-full overflow-x-clip">
      <section id="top" className="relative isolate min-h-[100dvh] overflow-hidden bg-[#EEF0F8] text-[#130F33]" onPointerMove={moveHeroReveal} onPointerLeave={hideHeroReveal}>
        <div ref={heroVisual} className="hero-photo hero-reveal absolute inset-0">
          <img
            src={assetUrl("images/hero-reveal-off.webp")}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[24%_center] lg:object-center"
            fetchPriority="high"
            loading="eager"
          />
          <img
            src={assetUrl("images/hero-reveal-on.webp")}
            alt=""
            aria-hidden="true"
            className="hero-reveal-lit pointer-events-none absolute inset-0 h-full w-full object-cover object-[24%_center] lg:object-center"
            loading="eager"
          />
        </div>
        <div className="hero-shell pointer-events-none relative z-[1] mx-auto flex min-h-[100dvh] max-w-[1500px] items-start px-5 pb-20 pt-16 md:px-10 md:pt-32 lg:pb-24 lg:pt-40">
          <HeroCopy />
        </div>
        <div aria-hidden="true" className="hero-copy-inverse pointer-events-none absolute inset-0 z-[2]" style={{ "--hero-text-mask": `url("${assetUrl("images/hero-text-mask.png")}")` }}>
          <div className="hero-shell mx-auto flex min-h-[100dvh] max-w-[1500px] items-start px-5 pb-20 pt-16 md:px-10 md:pt-32 lg:pb-24 lg:pt-40">
            <HeroCopy inverse />
          </div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-[#130F33] bg-white py-4">
        <div className="marquee-track flex w-max items-center whitespace-nowrap text-sm uppercase tracking-[0.09em]">
          {[...clinics, ...clinics].map((clinic, index) => <span key={`${clinic.rank}-${index}`} className="flex items-center"><span className="mx-6 h-1.5 w-1.5 rounded-full bg-[#A5BEBE]" />{clinic.name}</span>)}
        </div>
      </div>

      <section id="study" className="bg-white pb-20 pt-12 lg:pb-24 lg:pt-16">
        <div ref={studyTabsStart} className="mx-auto max-w-[1500px] px-5 md:px-10">
          <nav ref={studyNav} className="study-tabs sticky top-0 z-[80] grid grid-cols-3 border border-[#130F33] bg-white" aria-label="Навигация по исследованию">
            {tabs.map((tab) => <a key={tab.id} href={`#${tab.id}`} aria-current={activeTab === tab.id ? "location" : undefined} onClick={(event) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              switchTab(tab.id);
            }} className={`focus-ring min-w-0 border-r border-[#130F33] px-2 py-4 text-center text-[clamp(0.72rem,3.35vw,0.95rem)] font-medium leading-tight transition-colors last:border-r-0 sm:px-4 sm:py-5 sm:text-base lg:px-6 ${activeTab === tab.id ? "bg-[#130F33] text-white" : "bg-white text-[#130F33] hover:bg-[#C6DAD5]"}`}>{tab.label}</a>)}
          </nav>

          <section id="rating" aria-label="Рейтинг клиник" className="study-section pt-12 lg:pt-16">
                <div className="reveal-heading grid gap-8 lg:grid-cols-12"><h2 className="text-[clamp(3rem,5vw,5.7rem)] font-medium leading-[0.95] tracking-[-0.045em] lg:col-span-7">Рейтинг клиник</h2><div className="lg:col-span-5"><p className="text-xl font-medium leading-relaxed">Сравниваем клиники по скорости и стабильности обработки онлайн-заявок, а также по тому, насколько полно они сопровождают пациента после обращения.</p><p className="mt-5 text-[#6D7E80]">Основным показателем является среднее время до первого звонка.</p></div></div>
                {showTopClinics && <TopClinics />}
                <RatingTable />
          </section>
          <section id="nominations" aria-label="Номинации" className="study-section mt-16 pt-12 lg:mt-24 lg:pt-16">
            <Nominations />
          </section>
          <section id="market" aria-label="Что происходит на рынке" className="study-section mt-16 pt-12 lg:mt-24 lg:pt-16">
            <Market />
          </section>
        </div>
      </section>

      <Methodology />

      <section id="contact" className="relative isolate min-h-[760px] overflow-hidden bg-[#EEF0F8] py-14 lg:min-h-[820px] lg:py-16" onPointerMove={moveContactReveal} onPointerLeave={hideContactReveal}>
        <div ref={contactVisual} className="contact-visual contact-reveal pointer-events-none absolute inset-0">
          <img src={assetUrl("images/contact-growth-lens-off.png")} alt="" aria-hidden="true" className="contact-scene absolute inset-0 h-full w-full" loading="lazy" />
          <img src={assetUrl("images/contact-growth-lens-on.png")} alt="" aria-hidden="true" className="contact-scene contact-reveal-lit absolute inset-0 h-full w-full" loading="lazy" />
        </div>
        <div className="contact-mobile-veil pointer-events-none absolute inset-0 lg:hidden" />
        <div className="relative mx-auto grid min-h-[650px] max-w-[1500px] items-center px-5 md:px-10 lg:grid-cols-12">
          <div className="contact-content lg:col-span-6 lg:col-start-7">
            <h2 className="contact-heading max-w-4xl text-[clamp(3rem,5.4vw,6.3rem)] font-medium leading-[0.92] tracking-[-0.055em]">Где ваша клиника теряет пациентов?</h2>
            <p className="contact-lead mt-6 max-w-2xl text-lg leading-relaxed">Заявка — только начало пути. Важно, что происходит дальше: насколько удобно записаться, как быстро клиника выходит на связь, подтверждает визит, напоминает о нём и возвращает пациента после отмены.</p>
            <div className="contact-glass hero-frost-panel mt-7 p-5 lg:p-6"><p className="max-w-3xl text-lg leading-relaxed">Реаспект помогает клиникам выстраивать digital-маркетинг как единую систему — от привлечения пациента и сайта до аналитики и CRM-коммуникаций. Поможем найти слабые места в пути пациента и определить точки роста.</p></div>
            <div className="contact-actions mt-4 bg-[#130F33] p-6 text-white lg:p-7">
              <a href="https://www.reaspekt.ru/?utm_source=rating&utm_medium=pr&utm_campaign=page&utm_content=cases&utm_term=common" target="_blank" rel="noreferrer" aria-label="Перейти на сайт Реаспекта" className="focus-ring inline-flex items-center gap-3"><img src={assetUrl("brand/reaspekt-mark-white.png")} alt="" className="h-9 w-9 shrink-0 object-contain" /><img src={assetUrl("brand/reaspekt-logo.png")} alt="Реаспект" className="w-36 brightness-0 invert" /></a>
              <a href="https://www.reaspekt.ru/contacts/?utm_source=rating&utm_medium=pr&utm_campaign=page&utm_content=cta" target="_blank" rel="noreferrer" className="focus-ring group mt-6 flex w-full items-center justify-between gap-4 bg-white px-6 py-4 text-left font-medium text-[#130F33] transition-colors hover:bg-[#C6DAD5] active:translate-y-px">Оставить заявку на сайте Реаспекта <ArrowUpRight className="shrink-0 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" size={20} /></a>
              <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-3">
                <a href="https://www.reaspekt.ru/cases/health-wellness/?utm_source=rating&utm_medium=pr&utm_campaign=page&utm_content=cases" target="_blank" rel="noreferrer" className="focus-ring inline-flex border-b border-white/50 pb-1 text-sm text-white/80 transition-colors hover:text-white">Смотреть кейсы в медицине</a>
                <a href="https://www.reaspekt.ru/?utm_source=rating&utm_medium=pr&utm_campaign=page&utm_content=cases&utm_term=common" target="_blank" rel="noreferrer" className="focus-ring inline-flex border-b border-white/50 pb-1 text-sm text-white/80 transition-colors hover:text-white">Перейти на сайт агентства</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#130F33] py-12 text-white">
        <div className="mx-auto grid max-w-[1500px] gap-10 px-5 md:px-10 lg:grid-cols-12 lg:gap-8">
          <p className="max-w-3xl text-sm leading-relaxed text-white/65 lg:col-span-6">Исследование подготовлено <strong className="font-medium text-white">Реаспект</strong> — агентством digital-маркетинга. Работаем на основе данных и помогаем бизнесу расти с помощью рекламы, SEO, аналитики, CRM-маркетинга и развития сайтов.</p>
          <address className="text-sm not-italic leading-relaxed text-white/65 lg:col-span-4 lg:col-start-8">
            <strong className="font-medium text-white">ООО «Реаспект»</strong><br />
            ИНН 1661018256, ОГРН 1071690028530<br />
            420111, Республика Татарстан, г. Казань, ул. Кремлевская, д. 21, помещение 79<br />
            <a href="mailto:info@reaspekt.ru" className="focus-ring border-b border-white/40 text-white transition-colors hover:border-white">info@reaspekt.ru</a>
          </address>
          <a href="#top" className="focus-ring group flex items-center gap-2 text-sm text-white/70 hover:text-white lg:col-span-1 lg:col-start-12 lg:justify-self-end">Наверх <ArrowUp className="transition-transform group-hover:-translate-y-1" size={17} /></a>
        </div>
      </footer>
    </main>
  );
}

export default App;
