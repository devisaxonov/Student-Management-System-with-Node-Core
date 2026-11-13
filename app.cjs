const fs = require("node:fs/promises");
const path = require("path");
const os = require("node:os");

const readline = require("node:readline/promises");
const { stdin, stdout, allowedNodeEnvironmentFlags } = require("node:process");
const { writeFile } = require("node:fs");

const rl = readline.createInterface({
  input: stdin,
  output: stdout,
});

const DATA_DIR = path.join(__dirname, "data");
const REPORTS_DIR = path.join(__dirname, "reports");
const UPLOADS_DIR = path.join(__dirname, "uploads");
const STUDENTS_FILE = path.join(DATA_DIR, "students.json");

async function initializeProject() {
  await fs.mkdir(DATA_DIR, {
    recursive: true,
  });
  await fs.mkdir(REPORTS_DIR, {
    recursive: true,
  });
  await fs.mkdir(UPLOADS_DIR, {
    recursive: true,
  });

  try {
    await fs.access(STUDENTS_FILE);
  } catch {
    fs.writeFile(STUDENTS_FILE, "[]", "utf8");
  }

  console.log("Loyiha muvaffaqiyatli tayyorlandi");
}

async function readStudents() {
  const data = await fs.readFile(STUDENTS_FILE, "utf8");
  return JSON.parse(data);
}

async function writeStudent(students) {
  const data = JSON.stringify(students, null, 2);

  await fs.writeFile(STUDENTS_FILE, data, "utf8");
}

async function addStudent(name, age, course) {
  const students = await readStudents();

  const newId =
    students.length > 0
      ? Math.max(...students.map((student) => student.id)) + 1
      : 1;

  const newStudent = {
    id: newId,
    name,
    age,
    course,
  };

  students.push(newStudent);

  await writeStudent(students);

  console.log("Talaba Muvaffaqiyatli yozildi");
  console.log(newStudent);
}

async function showStudents() {
  const students = await readStudents();

  if (students.length == 0) {
    console.log("Hali hech qanday sudent yo'q");
    return;
  }

  console.log("\n=====Talabalar Malumotlari =====");

  for (const student of students) {
    console.log("-----------------------------");
    console.log(`ID: ${student.id}`);
    console.log(`Name: ${student.name}`);
    console.log(`Age: ${student.age}`);
    console.log(`Course: ${student.course}`);
  }
}

async function findStudent(id) {
  const students = await readStudents();

  const student = students.find((student) => student.id == id);

  if (!student) {
    console.log("Bunday talaba topilmadi");
    return;
  }

  console.log("\nTalaba topildi");
  console.log(student);
}

async function updateStudent(id, newName, newAge, newCourse) {
  const students = await readStudents();

  const student = students.find((student) => student.id == id);

  if (!student) {
    console.log("Bu id da talaba mavjud emas!");
    return;
  }

  student.name = newName;
  student.age = newAge;
  student.course = newCourse;

  await writeStudent(students);

  console.log(`Muvaffaqiyatli yangilandi\n}`);
}

async function deleteStudent(id) {
  const students = await readStudents();

  const studentExists = students.find((student) => student.id == id);

  if (!studentExists) {
    console.log("Bu Id da talaba mavjud emas");
    return;
  }

  const filteredStudents = students.filter((student) => student.id != id);

  await writeStudent(filteredStudents);

  console.log("Talaba muvaffaqiyatli o'chirildi");
}

async function createReport() {
  const students = await readStudents();

  let report = "TALABALAR HISOBOTI\n";
  report += "=============================\n\n";

  report += `Jami talabalar soni: ${students.length}\n`;

  for (const student of students) {
    report += `Id: ${student.id}\n`;
    report += `Name: ${student.name}\n`;
    report += `Age: ${student.age}\n`;
    report += `Course: ${student.course}\n`;
    report += "---------------------------\n";
  }

  const fileName = `students-${Date.now()}.txt`;

  const reportPath = path.join(REPORTS_DIR, fileName);

  await fs.writeFile(reportPath, report, "utf8");
  console.log("Hisobot yaratildi: ", reportPath);
}

async function createSystemReport() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const cpu = os.cpus();

  const systemInfo = {
    hostname: os.hostname(),
    platform: os.platform(),
    osType: os.type(),
    osVersion: os.version(),
    osPlatform: os.platform(),
    cpuModel: cpu[0]?.model ?? "Nomalum",
    cpuCore: cpu.length,

    totalMemory: (totalMemory / 1024 ** 3).toFixed(2) + "GB",
    freeMemory: (freeMemory / 1024 ** 3).toFixed(2) + "GB",
    usedMemory: (usedMemory / 1024 ** 3).toFixed(2) + "GB",
    uptimeHours: (os.uptime() / 3600).toFixed(2),
  };

  const filePath = path.join(UPLOADS_DIR, "system_info.txt");

  await fs.writeFile(filePath, JSON.stringify(systemInfo, null, 2), "utf8");

  console.log("Hisobot tayyorlandi!");
  console.log(systemInfo);
}

async function showMenu() {
  console.log(`
========== STUDENT MANAGEMENT ==========

1. Talaba qo'shish
2. Barcha talabalarni ko'rish
3. ID orqali talaba qidirish
4. Talaba ma'lumotlarini yangilash
5. Talabani o'chirish
6. Talabalar hisobotini yaratish
7. Kompyuter haqida hisobot
0. Dasturdan chiqish

=========================================
    `);

  const choice = await rl.question("Tanlovingiz: ");

  return choice.trim();
}

async function startApp() {
  await initializeProject();

  let isRunning = true;

  while (isRunning) {
    const choice = await showMenu();

    try {
      switch (choice) {
        case "1": {
          const name = await rl.question("Talaba ismini kiriting:");
          const age = Number(await rl.question("Talaba yoshini kiriting: "));
          const course = await rl.question("Talaba kursini kiriting: ");

          if (
            !name.trim() ||
            !Number.isInteger(age) ||
            age < 1 ||
            !course.trim()
          ) {
            console.log("Malumotlar to'g'ri kiritilmagan!");
            break;
          }
          await addStudent(name.trim(), age, course.trim());
          break;
        }
        case "2": {
          await showStudents();
          break;
        }
        case "3": {
          const id = Number(
            await rl.question("Qidirilayotgan talaba ID sini kiritng: "),
          );

          if (!Number.isInteger(id) || id < 1) {
            console.log("ID xato!");
            break;
          }

          await findStudent(id);
          break;
        }
        case "4": {
          const id = Number(
            await rl.question(
              "O'zgartirmoqchi bo'lgan talaba idsini kiriting:",
            ),
          );

          if (!Number.isInteger(id) || id < 1) {
            console.log("Id xato!");
            break;
          }

          let newName = await rl.question("Yangi ism: ");
          let newAge = Number(await rl.question("Yangi yosh: "));
          let newCourse = await rl.question("Yangi course nomi: ");

          if (
            !newName.trim() ||
            !Number.isInteger(newAge) ||
            newAge < 1 ||
            !newCourse.trim()
          ) {
            console.log("Malumot kiritishda xatolik mavjud!");
            break;
          }

          await updateStudent(id, newName.trim(), newAge, newCourse.trim());
          break;
        }

        case "5": {
          const id = Number(
            await rl.question("O'chirmoqchi bo'lgan talaba idsini kiriting:"),
          );

          if (!Number.isInteger(id) || id < 1) {
            console.log("Id xato!");
            break;
          }

          await deleteStudent(id);
          break;
        }
        case "6":
          await createReport();
          break;
        case "7":
          await createSystemReport();
          break;
        case "0":
          console.log("Tizimdan chiqildi");
          isRunning = false;
          break;

        default:
          console.log("Bunday tanlov yo'q!");
      }
    } catch (e) {
      console.log("Xatolik yuz berdi: ", e.message);
    }
  }
  rl.close();
}


startApp().catch(err => {
    console.log("Dastur xatosi",err);
    rl.close()
})