/* =========================================================
   부산진고 학교생활 정보 페이지
   학생회 정보부
========================================================= */


/* =========================================================
   1. 학교 설정
========================================================= */

const CONFIG = {

    schoolName: "부산진고등학교",

    // 부산광역시교육청
    officeCode: "C10",

    // 처음에는 자동 조회
    schoolCode: null,

    /*
        NEIS 인증키

        현재는 비워둠.
        나중에 정식 운영 단계에서 안전한 방식으로 연결.
    */
    neisKey: ""

};



/* =========================================================
   2. 급식 긴급 수정 시스템
========================================================= */

const MEAL_OVERRIDE = {

    enabled: false,

    data: {

        /*
        예시

        "20260907": [
            "백미밥",
            "돼지국밥",
            "깍두기",
            "요구르트"
        ]
        */

    }

};



/* =========================================================
   기본 변수
========================================================= */

const contentBox =
    document.getElementById("contentBox");


let currentMealDate =
    new Date();


let currentScheduleDate =
    new Date();



/* =========================================================
   날짜 → YYYYMMDD
========================================================= */

function formatDateForAPI(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}${month}${day}`;

}



/* =========================================================
   날짜 화면 표시
========================================================= */

function formatDateKorean(date) {

    const days = [
        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토"
    ];


    return (
        `${date.getFullYear()}년 ` +
        `${date.getMonth() + 1}월 ` +
        `${date.getDate()}일 ` +
        `(${days[date.getDay()]})`
    );

}



/* =========================================================
   fetch timeout

   API 서버가 응답하지 않을 경우
   무한 로딩 방지
========================================================= */

async function fetchWithTimeout(
    url,
    timeout = 8000
) {

    const controller =
        new AbortController();


    const timeoutId =
        setTimeout(
            () => controller.abort(),
            timeout
        );


    try {

        const response =
            await fetch(
                url,
                {
                    signal: controller.signal
                }
            );


        return response;

    }

    finally {

        clearTimeout(
            timeoutId
        );

    }

}



/* =========================================================
   학교 코드 자동 조회
========================================================= */

async function getSchoolCode() {

    if (CONFIG.schoolCode) {

        return CONFIG.schoolCode;

    }


    const params =
        new URLSearchParams({

            Type: "json",

            pIndex: "1",

            pSize: "5",

            ATPT_OFCDC_SC_CODE:
                CONFIG.officeCode,

            SCHUL_NM:
                CONFIG.schoolName

        });


    if (CONFIG.neisKey) {

        params.append(
            "KEY",
            CONFIG.neisKey
        );

    }


    const url =

        "https://open.neis.go.kr/hub/schoolInfo?" +

        params.toString();


    const response =
        await fetchWithTimeout(url);


    if (!response.ok) {

        throw new Error(
            "학교 정보를 가져오지 못했습니다."
        );

    }


    const data =
        await response.json();


    if (
        !data.schoolInfo ||
        !data.schoolInfo[1] ||
        !data.schoolInfo[1].row ||
        data.schoolInfo[1].row.length === 0
    ) {

        throw new Error(
            "학교 정보를 찾지 못했습니다."
        );

    }


    const school =
        data.schoolInfo[1].row[0];


    CONFIG.schoolCode =
        school.SD_SCHUL_CODE;


    console.log(
        "학교 코드:",
        CONFIG.schoolCode
    );


    return CONFIG.schoolCode;

}



/* =========================================================
   급식
========================================================= */

function showMeal() {

    currentMealDate =
        new Date();


    loadMeal(
        currentMealDate
    );

}



/* =========================================================
   특정 날짜 급식
========================================================= */

async function loadMeal(date) {

    contentBox.classList.remove(
        "hidden"
    );


    contentBox.innerHTML = `

        <h2>🍚 급식</h2>

        <p class="loading">
            급식 정보를 불러오는 중...
        </p>

    `;


    moveDown();


    try {

        const dateCode =
            formatDateForAPI(date);


        /* 긴급 수정 확인 */

        if (
            MEAL_OVERRIDE.enabled &&
            MEAL_OVERRIDE.data[dateCode]
        ) {

            displayManualMeal(

                date,

                MEAL_OVERRIDE.data[
                    dateCode
                ]

            );


            return;

        }


        const schoolCode =
            await getSchoolCode();


        const params =
            new URLSearchParams({

                Type: "json",

                pIndex: "1",

                pSize: "5",

                ATPT_OFCDC_SC_CODE:
                    CONFIG.officeCode,

                SD_SCHUL_CODE:
                    schoolCode,

                MLSV_YMD:
                    dateCode

            });


        if (CONFIG.neisKey) {

            params.append(
                "KEY",
                CONFIG.neisKey
            );

        }


        const url =

            "https://open.neis.go.kr/hub/mealServiceDietInfo?" +

            params.toString();


        const response =
            await fetchWithTimeout(url);


        if (!response.ok) {

            throw new Error(
                "급식 서버 연결 실패"
            );

        }


        const data =
            await response.json();


        if (
            !data.mealServiceDietInfo ||
            !data.mealServiceDietInfo[1] ||
            !data.mealServiceDietInfo[1].row
        ) {

            displayNoMeal(date);

            return;

        }


        const meals =
            data.mealServiceDietInfo[1].row;


        let meal =
            meals.find(

                item =>
                    item.MMEAL_SC_NM ===
                    "중식"

            );


        if (!meal) {

            meal =
                meals[0];

        }


        displayMeal(
            date,
            meal
        );

    }

    catch (error) {

        console.error(error);


        contentBox.innerHTML = `

            <h2>🍚 급식</h2>

            <div class="error">

                급식 정보를 불러오지 못했습니다.

                <br><br>

                잠시 후 다시 시도해주세요.

            </div>

            ${mealButtonsHTML()}

        `;

    }

}



/* =========================================================
   급식 표시
========================================================= */

function displayMeal(
    date,
    meal
) {

    const menu =
        meal.DDISH_NM
            .replaceAll(
                "<br/>",
                "<br>"
            );


    contentBox.innerHTML = `

        <h2>
            🍚 급식
        </h2>

        <strong>
            ${formatDateKorean(date)}
        </strong>

        <div class="meal-menu">

            ${menu}

        </div>

        ${
            meal.CAL_INFO
                ?
                `<p>🔥 ${meal.CAL_INFO}</p>`
                :
                ""
        }

        ${mealButtonsHTML()}

    `;

}



/* =========================================================
   긴급수정 급식 표시
========================================================= */

function displayManualMeal(
    date,
    menu
) {

    const menuHTML =
        menu.join("<br>");


    contentBox.innerHTML = `

        <h2>🍚 급식</h2>

        <strong>
            ${formatDateKorean(date)}
        </strong>

        <div class="meal-menu">

            ${menuHTML}

        </div>

        <p>
            ※ 학교 사정에 따라 수정된 급식 정보입니다.
        </p>

        ${mealButtonsHTML()}

    `;

}



/* =========================================================
   급식 없는 날
========================================================= */

function displayNoMeal(date) {

    contentBox.innerHTML = `

        <h2>🍚 급식</h2>

        <strong>
            ${formatDateKorean(date)}
        </strong>

        <div class="meal-menu">

            등록된 급식이 없습니다.

        </div>

        ${mealButtonsHTML()}

    `;

}



/* =========================================================
   급식 버튼 HTML
========================================================= */

function mealButtonsHTML() {

    return `

        <div class="meal-buttons">

            <button
                onclick="changeMealDate(-1)"
            >
                ← 이전날
            </button>

            <button
                onclick="goToday()"
            >
                오늘
            </button>

            <button
                onclick="changeMealDate(1)"
            >
                다음날 →
            </button>

        </div>


        <button
            class="month-button"
            onclick="showMonthlyMeal()"
        >
            📅 이번 달 급식 보기
        </button>

    `;

}



/* =========================================================
   급식 날짜 이동
========================================================= */

function changeMealDate(amount) {

    currentMealDate.setDate(

        currentMealDate.getDate()
        + amount

    );


    loadMeal(
        currentMealDate
    );

}



/* =========================================================
   오늘
========================================================= */

function goToday() {

    currentMealDate =
        new Date();


    loadMeal(
        currentMealDate
    );

}



/* =========================================================
   월간 급식
========================================================= */

async function showMonthlyMeal() {

    contentBox.innerHTML = `

        <h2>
            📅 이번 달 급식
        </h2>

        <p class="loading">

            이번 달 급식을 불러오는 중...

        </p>

    `;


    try {

        const schoolCode =
            await getSchoolCode();


        const year =
            currentMealDate.getFullYear();


        const month =
            currentMealDate.getMonth();


        const firstDay =
            new Date(
                year,
                month,
                1
            );


        const lastDay =
            new Date(
                year,
                month + 1,
                0
            );


        const params =
            new URLSearchParams({

                Type: "json",

                pIndex: "1",

                pSize:
                    CONFIG.neisKey
                        ? "100"
                        : "5",

                ATPT_OFCDC_SC_CODE:
                    CONFIG.officeCode,

                SD_SCHUL_CODE:
                    schoolCode,

                MLSV_FROM_YMD:
                    formatDateForAPI(
                        firstDay
                    ),

                MLSV_TO_YMD:
                    formatDateForAPI(
                        lastDay
                    )

            });


        if (CONFIG.neisKey) {

            params.append(
                "KEY",
                CONFIG.neisKey
            );

        }


        const url =

            "https://open.neis.go.kr/hub/mealServiceDietInfo?" +

            params.toString();


        const response =
            await fetchWithTimeout(url);


        const data =
            await response.json();


        if (
            !data.mealServiceDietInfo ||
            !data.mealServiceDietInfo[1]
        ) {

            contentBox.innerHTML = `

                <h2>
                    📅 이번 달 급식
                </h2>

                <p>
                    등록된 급식이 없습니다.
                </p>

                <button
                    class="month-button"
                    onclick="showMeal()"
                >
                    오늘 급식으로 돌아가기
                </button>

            `;

            return;

        }


        const meals =
            data.mealServiceDietInfo[1].row;


        let html = `

            <h2>
                📅 ${year}년
                ${month + 1}월 급식
            </h2>

        `;


        meals.forEach(
            meal => {

                if (
                    meal.MMEAL_SC_NM !==
                    "중식"
                ) {

                    return;

                }


                const date =
                    meal.MLSV_YMD;


                const day =
                    Number(
                        date.substring(
                            6,
                            8
                        )
                    );


                const menu =
                    meal.DDISH_NM
                        .replaceAll(
                            "<br/>",
                            "<br>"
                        );


                html += `

                    <div class="month-meal">

                        <strong>

                            ${month + 1}월
                            ${day}일

                        </strong>

                        <br>

                        ${menu}

                    </div>

                `;

            }

        );


        html += `

            <button
                class="month-button"
                onclick="showMeal()"
            >

                오늘 급식으로 돌아가기

            </button>

        `;


        contentBox.innerHTML =
            html;

    }

    catch (error) {

        console.error(error);


        contentBox.innerHTML = `

            <h2>
                📅 이번 달 급식
            </h2>

            <div class="error">

                급식 정보를 불러오지 못했습니다.

            </div>

            <button
                class="month-button"
                onclick="showMeal()"
            >

                돌아가기

            </button>

        `;

    }

}



/* =========================================================
   학사일정
========================================================= */

function showSchedule() {

    currentScheduleDate =
        new Date();


    loadSchedule(
        currentScheduleDate
    );

}



/* =========================================================
   학사일정 한 페이지 요청
========================================================= */

async function requestSchedulePage(
    schoolCode,
    from,
    to,
    page
) {

    const params =
        new URLSearchParams({

            Type: "json",

            pIndex:
                String(page),

            pSize:
                CONFIG.neisKey
                    ? "100"
                    : "5",

            ATPT_OFCDC_SC_CODE:
                CONFIG.officeCode,

            SD_SCHUL_CODE:
                schoolCode,

            AA_FROM_YMD:
                from,

            AA_TO_YMD:
                to

        });


    if (CONFIG.neisKey) {

        params.append(
            "KEY",
            CONFIG.neisKey
        );

    }


    const url =

        "https://open.neis.go.kr/hub/SchoolSchedule?" +

        params.toString();


    const response =
        await fetchWithTimeout(url);


    if (!response.ok) {

        throw new Error(
            "학사일정 서버 연결 실패"
        );

    }


    return await response.json();

}



/* =========================================================
   학사일정 불러오기
========================================================= */

async function loadSchedule(date) {

    contentBox.classList.remove(
        "hidden"
    );


    const year =
        date.getFullYear();


    const month =
        date.getMonth();


    contentBox.innerHTML = `

        <h2>
            📅 ${year}년
            ${month + 1}월 학사일정
        </h2>

        <p class="loading">

            학사일정을 불러오는 중...

        </p>

    `;


    moveDown();


    try {

        const schoolCode =
            await getSchoolCode();


        const firstDay =
            new Date(
                year,
                month,
                1
            );


        const lastDay =
            new Date(
                year,
                month + 1,
                0
            );


        const from =
            formatDateForAPI(
                firstDay
            );


        const to =
            formatDateForAPI(
                lastDay
            );


        let schedules = [];


        /*
            인증키가 있으면 한 번에 최대 100개

            인증키가 없으면 sample key이므로
            첫 5건만 받을 수 있음.
        */

        const data =
            await requestSchedulePage(

                schoolCode,

                from,

                to,

                1

            );


        if (
            !data.SchoolSchedule ||
            !data.SchoolSchedule[1] ||
            !data.SchoolSchedule[1].row
        ) {

            displayNoSchedule(
                year,
                month
            );

            return;

        }


        schedules =
            data.SchoolSchedule[1].row;


        displaySchedule(

            year,
            month,
            schedules

        );

    }

    catch (error) {

        console.error(
            "학사일정 오류:",
            error
        );


        contentBox.innerHTML = `

            <h2>
                📅 ${year}년
                ${month + 1}월 학사일정
            </h2>

            <div class="error">

                학사일정을 불러오지 못했습니다.

                <br><br>

                인터넷 연결 또는
                NEIS 서버 상태를 확인해주세요.

            </div>

            ${scheduleButtonsHTML()}

        `;

    }

}



/* =========================================================
   학사일정 표시
========================================================= */

function displaySchedule(
    year,
    month,
    schedules
) {

    schedules.sort(
        (a, b) =>
            a.AA_YMD.localeCompare(
                b.AA_YMD
            )
    );


    let html = `

        <h2>

            📅 ${year}년
            ${month + 1}월 학사일정

        </h2>

    `;


    schedules.forEach(
        schedule => {

            const date =
                schedule.AA_YMD;


            const day =
                Number(
                    date.substring(
                        6,
                        8
                    )
                );


            const scheduleDate =
                new Date(

                    Number(
                        date.substring(
                            0,
                            4
                        )
                    ),

                    Number(
                        date.substring(
                            4,
                            6
                        )
                    ) - 1,

                    day

                );


            const days = [

                "일",
                "월",
                "화",
                "수",
                "목",
                "금",
                "토"

            ];


            const dayName =
                days[
                    scheduleDate.getDay()
                ];


            html += `

                <div class="month-meal">

                    <strong>

                        ${month + 1}월
                        ${day}일
                        (${dayName})

                    </strong>

                    <br>

                    ${schedule.EVENT_NM}

                </div>

            `;

        }

    );


    html +=
        scheduleButtonsHTML();


    contentBox.innerHTML =
        html;

}



/* =========================================================
   학사일정 없음
========================================================= */

function displayNoSchedule(
    year,
    month
) {

    contentBox.innerHTML = `

        <h2>

            📅 ${year}년
            ${month + 1}월 학사일정

        </h2>

        <div class="meal-menu">

            등록된 학사일정이 없습니다.

        </div>

        ${scheduleButtonsHTML()}

    `;

}



/* =========================================================
   학사일정 이동 버튼
========================================================= */

function scheduleButtonsHTML() {

    return `

        <div class="meal-buttons">

            <button
                onclick="changeScheduleMonth(-1)"
            >

                ← 이전 달

            </button>

            <button
                onclick="goCurrentScheduleMonth()"
            >

                이번 달

            </button>

            <button
                onclick="changeScheduleMonth(1)"
            >

                다음 달 →

            </button>

        </div>

    `;

}



/* =========================================================
   학사일정 이전/다음 달
========================================================= */

function changeScheduleMonth(amount) {

    currentScheduleDate =
        new Date(

            currentScheduleDate.getFullYear(),

            currentScheduleDate.getMonth()
            + amount,

            1

        );


    loadSchedule(
        currentScheduleDate
    );

}



/* =========================================================
   이번 달
========================================================= */

function goCurrentScheduleMonth() {

    currentScheduleDate =
        new Date();


    loadSchedule(
        currentScheduleDate
    );

}



/* =========================================================
   학생회 공지
========================================================= */

function showNotice() {

    contentBox.classList.remove(
        "hidden"
    );


    contentBox.innerHTML = `

        <h2>
            📢 학생회 공지
        </h2>

        <p>
            현재 등록된 학생회 공지가 없습니다.
        </p>

    `;


    moveDown();

}



/* =========================================================
   화면 이동
========================================================= */

function moveDown() {

    setTimeout(
        function () {

            contentBox.scrollIntoView({

                behavior: "smooth",

                block: "start"

            });

        },

        50
    );

}



/* =========================================================
   학생회 건의함
========================================================= */

document
    .getElementById(
        "suggestionLink"
    )
    .addEventListener(
        "click",
        function(event) {

            event.preventDefault();


            alert(
                "학생회 건의함 링크가 아직 등록되지 않았습니다."
            );

        }
    );



/* =========================================================
   Instagram
========================================================= */

document
    .getElementById(
        "instagramLink"
    )
    .addEventListener(
        "click",
        function(event) {

            event.preventDefault();


            alert(
                "학생회 Instagram 링크가 아직 등록되지 않았습니다."
            );

        }
    );