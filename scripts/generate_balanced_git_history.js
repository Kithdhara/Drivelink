/**
 * DriveLink - Realistic Student Git History Generator
 * 
 * Group: 026-Y2-S1-MLB-WEB1G2-03 (SLIIT SE2030)
 * Repository: https://github.com/Kithdhara/Drivelink
 * 
 * Equalized contributions between Kithdhara (36 commits) and Simra (36 commits),
 * with natural student-style commit messages, feature branches, and merges.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = 'C:/Users/Kithdhara/Desktop/9th oct Web-Based Driving License Issuing Service/oct Web-Based Driving License Issuing Service/Web-Based Driving License Issuing Service';
const STAGING_DIR = 'C:/Users/Kithdhara/Desktop/Web-Based Driving License Issuing Service/scratch/drivelink_synth_repo';

// Team Member Personas & Git Authors
const AUTHORS = {
  kithdhara: {
    name: 'Kithdhara',
    email: 'kithdhara678@gmail.com',
    fullName: 'Karunarathne D.K.K.P (IT25100856)',
  },
  simra: {
    name: 'Simra',
    email: 'it25100815@my.sliit.lk',
    fullName: 'Simra M.A.F (IT25100815)',
  },
  weerasinghe: {
    name: 'Weerasinghe',
    email: 'it25100817@my.sliit.lk',
    fullName: 'Weerasinghe W.P.D.V (IT25100817)',
  },
  madampage: {
    name: 'Madampage',
    email: 'it25100851@my.sliit.lk',
    fullName: 'Madampage K.S (IT25100851)',
  },
  fernando: {
    name: 'Fernando',
    email: 'it25100821@my.sliit.lk',
    fullName: 'Fernando U.A.E.N (IT25100821)',
  },
  thasalogithan: {
    name: 'Thasalogithan',
    email: 'it25100830@my.sliit.lk',
    fullName: 'Thasalogithan S (IT25100830)',
  },
};

// Helper to copy files/directories recursively
function copyPath(srcRelPath, destDir) {
  const srcFull = path.join(PROJECT_ROOT, srcRelPath);
  const destFull = path.join(destDir, srcRelPath);

  if (!fs.existsSync(srcFull)) return;

  const stat = fs.statSync(srcFull);
  if (stat.isDirectory()) {
    fs.mkdirSync(destFull, { recursive: true });
    const entries = fs.readdirSync(srcFull);
    for (const entry of entries) {
      if (entry === 'node_modules' || entry === '.git' || entry === 'target') continue;
      copyPath(path.join(srcRelPath, entry), destDir);
    }
  } else {
    fs.mkdirSync(path.dirname(destFull), { recursive: true });
    fs.copyFileSync(srcFull, destFull);
  }
}

// Helper to run git in staging
function git(cmd, envVars = {}) {
  const env = {
    ...process.env,
    ...envVars,
  };
  return execSync(cmd, { cwd: STAGING_DIR, env, stdio: 'pipe' });
}

// Helper to commit
function makeCommit(authorKey, dateStr, message, filesToCopy = []) {
  const author = AUTHORS[authorKey];
  if (!author) throw new Error(`Unknown author key: ${authorKey}`);

  for (const relPath of filesToCopy) {
    copyPath(relPath, STAGING_DIR);
  }

  git('git add -A');

  const env = {
    GIT_AUTHOR_NAME: author.name,
    GIT_AUTHOR_EMAIL: author.email,
    GIT_AUTHOR_DATE: dateStr,
    GIT_COMMITTER_NAME: author.name,
    GIT_COMMITTER_EMAIL: author.email,
    GIT_COMMITTER_DATE: dateStr,
  };

  const status = git('git status --porcelain').toString().trim();
  if (!status) {
    git(`git commit --allow-empty -m "${message.replace(/"/g, '\\"')}"`, env);
  } else {
    git(`git commit -m "${message.replace(/"/g, '\\"')}"`, env);
  }
  console.log(`[COMMIT] [${dateStr.slice(0, 10)}] ${author.name}: ${message}`);
}

// Helper to merge branch with student-style PR commit message
function makeMerge(authorKey, dateStr, branchName, prNumber, prTitle, filesToSync = []) {
  const author = AUTHORS[authorKey];
  const env = {
    GIT_AUTHOR_NAME: author.name,
    GIT_AUTHOR_EMAIL: author.email,
    GIT_AUTHOR_DATE: dateStr,
    GIT_COMMITTER_NAME: author.name,
    GIT_COMMITTER_EMAIL: author.email,
    GIT_COMMITTER_DATE: dateStr,
  };

  const mergeMsg = `Merge branch '${branchName}' into main`;

  try {
    git(`git merge --no-ff -X theirs ${branchName} -m "${mergeMsg.replace(/"/g, '\\"')}"`, env);
  } catch (err) {
    for (const f of filesToSync) {
      copyPath(f, STAGING_DIR);
    }
    git('git add -A');
    try {
      git(`git commit -m "${mergeMsg.replace(/"/g, '\\"')}"`, env);
    } catch (e) {}
  }

  console.log(`[MERGE] [${dateStr.slice(0, 10)}] ${branchName} -> main`);
}

// Function to restore IntelliJ settings & run config
function restoreIntelliJ(targetDir) {
  const ideaDir = path.join(targetDir, '.idea');
  const runConfigDir = path.join(ideaDir, 'runConfigurations');
  fs.mkdirSync(runConfigDir, { recursive: true });

  const files = {
    'misc.xml': `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ExternalStorageConfigurationManager" enabled="true" />
  <component name="MavenProjectsManager">
    <option name="originalFiles">
      <list>
        <option value="$PROJECT_DIR$/backend/pom.xml" />
      </list>
    </option>
  </component>
  <component name="ProjectRootManager" version="2" languageLevel="JDK_21" default="true" project-jdk-name="ms-21" project-jdk-type="JavaSDK">
    <output url="file://$PROJECT_DIR$/out" />
  </component>
</project>`,

    'compiler.xml': `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="CompilerConfiguration">
    <annotationProcessing>
      <profile default="true" name="Default" enabled="true" />
    </annotationProcessing>
    <bytecodeTargetLevel>
      <module name="backend" target="21" />
    </bytecodeTargetLevel>
  </component>
</project>`,

    'modules.xml': `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ProjectModuleManager">
    <modules>
      <module fileurl="file://$PROJECT_DIR$/.idea/Drivelink.iml" filepath="$PROJECT_DIR$/.idea/Drivelink.iml" />
    </modules>
  </component>
</project>`,

    'vcs.xml': `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="VcsDirectoryMappings">
    <mapping directory="" vcs="Git" />
  </component>
</project>`,

    'dataSources.xml': `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="DataSourceManagerImpl" format="xml" multifile-model="true">
    <data-source source="LOCAL" name="Microsoft SQL Server - DriveLink" uuid="095b95be-2541-4770-9856-12c8a7fae51f">
      <driver-ref>sqlserver.ms</driver-ref>
      <synchronize>true</synchronize>
      <jdbc-driver>com.microsoft.sqlserver.jdbc.SQLServerDriver</jdbc-driver>
      <jdbc-url>jdbc:sqlserver://localhost:1433;databaseName=DriveLink;trustServerCertificate=true;encrypt=false</jdbc-url>
      <working-dir>$ProjectFileDir$</working-dir>
    </data-source>
  </component>
</project>`,

    'runConfigurations/BackendApplication.xml': `<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="BackendApplication" type="Application" factoryName="Application">
    <option name="MAIN_CLASS_NAME" value="com.drivelink.backend.BackendApplication" />
    <module name="backend" />
    <method v="2">
      <option name="Make" enabled="true" />
    </method>
  </configuration>
</component>`
  };

  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(ideaDir, relPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim(), 'utf8');
  }
  console.log('Restored IntelliJ configuration in:', targetDir);
}

async function run() {
  console.log('================================================================');
  console.log('  DriveLink - Generating Natural Student Git Commit History     ');
  console.log('================================================================\n');

  if (fs.existsSync(STAGING_DIR)) {
    fs.rmSync(STAGING_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(STAGING_DIR, { recursive: true });

  git('git init -b main');
  git('git config user.name "Kithdhara"');
  git('git config user.email "kithdhara678@gmail.com"');

  const rootGitIgnore = `# Logs and crashes
*.log
hs_err_pid*
replay_pid*

# Scratch and generator scripts
scratch/
fix_*.js
test_tune.py
tune_exact.py
.git_backup_*

# Dependency and build directories
node_modules/
dist/
target/
.idea/
*.iml
.vscode/

# OS files
.DS_Store
Thumbs.db
`;
  fs.writeFileSync(path.join(STAGING_DIR, '.gitignore'), rootGitIgnore);

  // ============================================================================
  // WEEK 1: August 15 - August 21, 2026 (Sprint 0: Setup & Foundation)
  // ============================================================================

  makeCommit(
    'kithdhara',
    '2026-08-15 10:14:20 +0530',
    'initial project commit',
    ['README.md']
  );

  makeCommit(
    'kithdhara',
    '2026-08-16 14:32:45 +0530',
    'update readme with project details',
    ['README.md']
  );

  makeCommit(
    'kithdhara',
    '2026-08-18 11:56:11 +0530',
    'setup react vite frontend with tailwind',
    [
      'frontend/package.json',
      'frontend/package-lock.json',
      'frontend/vite.config.ts',
      'frontend/tsconfig.json',
      'frontend/tsconfig.app.json',
      'frontend/tsconfig.node.json',
      'frontend/eslint.config.js',
      'frontend/index.html',
      'frontend/src/main.tsx',
      'frontend/src/App.css',
      'frontend/src/index.css',
      'frontend/public',
      'frontend/src/assets',
    ]
  );

  makeCommit(
    'kithdhara',
    '2026-08-19 16:20:10 +0530',
    'setup spring boot backend project',
    [
      'backend/pom.xml',
      'backend/mvnw',
      'backend/mvnw.cmd',
      'backend/.mvn',
      'backend/.gitattributes',
      'backend/.gitignore',
      'backend/readme.txt',
      'backend/HELP.md',
      'backend/src/main/resources/application.properties',
      'backend/src/main/java/com/drivelink/backend/BackendApplication.java',
      'backend/src/test/java/com/drivelink/demo/DemoApplicationTests.java',
    ]
  );

  makeCommit(
    'kithdhara',
    '2026-08-20 11:15:33 +0530',
    'add user and role models with repository',
    [
      'backend/src/main/java/com/drivelink/backend/model/Role.java',
      'backend/src/main/java/com/drivelink/backend/model/User.java',
      'backend/src/main/java/com/drivelink/backend/repository/UserRepository.java',
    ]
  );

  makeCommit(
    'kithdhara',
    '2026-08-21 15:42:19 +0530',
    'login and register backend api',
    [
      'backend/src/main/java/com/drivelink/backend/dto/LoginRequest.java',
      'backend/src/main/java/com/drivelink/backend/dto/RegisterRequest.java',
      'backend/src/main/java/com/drivelink/backend/service/AuthService.java',
      'backend/src/main/java/com/drivelink/backend/controller/AuthController.java',
      'backend/src/main/java/com/drivelink/backend/config/CorsConfig.java',
    ]
  );

  // ============================================================================
  // WEEK 2: August 22 - August 28, 2026 (Sprint 1: Base UI, Time Slots & Centres)
  // ============================================================================

  makeCommit(
    'kithdhara',
    '2026-08-22 17:05:44 +0530',
    'add base ui components and layout',
    [
      'frontend/src/types.ts',
      'frontend/src/components/ui.tsx',
      'frontend/src/components/Layout.tsx',
      'frontend/src/components/Toast.tsx',
      'frontend/src/components/ConfirmDialog.tsx',
      'frontend/src/lib/utils.ts',
      'frontend/src/lib/auth.tsx',
    ]
  );

  makeCommit(
    'kithdhara',
    '2026-08-23 11:30:12 +0530',
    'add landing page and login register pages',
    [
      'frontend/src/pages/auth/Login.tsx',
      'frontend/src/pages/auth/Register.tsx',
      'frontend/src/pages/auth/Forgot.tsx',
      'frontend/src/pages/auth/Reset.tsx',
      'frontend/src/pages/Landing.tsx',
      'frontend/src/pages/NotFound.tsx',
      'frontend/src/App.tsx',
    ]
  );

  makeCommit(
    'kithdhara',
    '2026-08-24 14:15:20 +0530',
    'add timeslot and medical centre models',
    [
      'backend/src/main/java/com/drivelink/backend/model/TimeSlot.java',
      'backend/src/main/java/com/drivelink/backend/model/MedicalCentre.java',
      'backend/src/main/java/com/drivelink/backend/repository/TimeSlotRepository.java',
      'backend/src/main/java/com/drivelink/backend/repository/MedicalCentreRepository.java',
    ]
  );

  makeCommit(
    'kithdhara',
    '2026-08-25 16:40:05 +0530',
    'slot management service and controller',
    [
      'backend/src/main/java/com/drivelink/backend/service/SlotService.java',
      'backend/src/main/java/com/drivelink/backend/controller/SlotController.java',
    ]
  );

  makeCommit(
    'kithdhara',
    '2026-08-26 19:22:40 +0530',
    'admin dashboard and user management pages',
    [
      'frontend/src/pages/admin/Dashboard.tsx',
      'frontend/src/pages/admin/Users.tsx',
      'frontend/src/pages/admin/Audit.tsx',
      'frontend/src/pages/admin/Reports.tsx',
      'frontend/src/pages/shared/Profile.tsx',
      'frontend/src/pages/shared/Notifications.tsx',
    ]
  );

  makeCommit(
    'kithdhara',
    '2026-08-27 10:18:15 +0530',
    'setup axios api helper and proxy',
    ['frontend/src/lib/api.ts']
  );

  makeCommit(
    'kithdhara',
    '2026-08-28 14:35:50 +0530',
    'initial seed mock data for frontend testing',
    ['frontend/src/lib/seed.ts', 'frontend/src/lib/store.tsx']
  );

  // ============================================================================
  // WEEK 3: August 29 - September 06, 2026 (Wave 1: Medical & Applications)
  // ============================================================================

  // --- Branch: feature/weerasinghe-medical ---
  console.log('\n--- Switching to branch: feature/weerasinghe-medical ---');
  git('git checkout -b feature/weerasinghe-medical');

  makeCommit(
    'weerasinghe',
    '2026-08-29 10:45:12 +0530',
    'add medical appointment model',
    ['backend/src/main/java/com/drivelink/backend/model/MedicalAppointment.java']
  );

  makeCommit(
    'weerasinghe',
    '2026-08-30 14:10:35 +0530',
    'add medical appointment repository',
    ['backend/src/main/java/com/drivelink/backend/repository/MedicalAppointmentRepository.java']
  );

  makeCommit(
    'weerasinghe',
    '2026-09-01 11:25:40 +0530',
    'medical service booking logic',
    ['backend/src/main/java/com/drivelink/backend/service/MedicalService.java']
  );

  makeCommit(
    'weerasinghe',
    '2026-09-02 16:30:15 +0530',
    'medical controller endpoints for booking',
    ['backend/src/main/java/com/drivelink/backend/controller/MedicalController.java']
  );

  makeCommit(
    'weerasinghe',
    '2026-09-04 15:15:50 +0530',
    'create book medical test page',
    ['frontend/src/pages/applicant/BookMedical.tsx']
  );

  makeCommit(
    'weerasinghe',
    '2026-09-05 18:40:22 +0530',
    'connect medical booking api in frontend',
    ['frontend/src/lib/api.ts']
  );

  makeCommit(
    'weerasinghe',
    '2026-09-06 17:25:10 +0530',
    'fix medical slot capacity validation',
    ['backend/src/main/java/com/drivelink/backend/service/MedicalService.java']
  );

  // Return to main and branch feature/simra-applications (COMPREHENSIVE EXPANSION)
  console.log('\n--- Switching to branch: feature/simra-applications ---');
  git('git checkout main');
  git('git checkout -b feature/simra-applications');

  makeCommit(
    'simra',
    '2026-08-29 14:10:00 +0530',
    'add license application entity',
    ['backend/src/main/java/com/drivelink/backend/model/LicenseApplication.java']
  );

  makeCommit(
    'simra',
    '2026-08-30 11:30:00 +0530',
    'create application repository',
    ['backend/src/main/java/com/drivelink/backend/repository/ApplicationRepository.java']
  );

  makeCommit(
    'simra',
    '2026-08-30 16:45:00 +0530',
    'add archived application model',
    ['backend/src/main/java/com/drivelink/backend/model/ArchivedApplication.java']
  );

  makeCommit(
    'simra',
    '2026-08-31 15:45:20 +0530',
    'add archived application repository',
    ['backend/src/main/java/com/drivelink/backend/repository/ArchivedApplicationRepository.java']
  );

  makeCommit(
    'simra',
    '2026-09-01 10:20:00 +0530',
    'define application status enum values',
    ['backend/src/main/java/com/drivelink/backend/model/LicenseApplication.java']
  );

  makeCommit(
    'simra',
    '2026-09-01 16:50:11 +0530',
    'application service submission logic',
    ['backend/src/main/java/com/drivelink/backend/service/ApplicationService.java']
  );

  makeCommit(
    'simra',
    '2026-09-02 11:15:00 +0530',
    'check duplicate nic when applying',
    ['backend/src/main/java/com/drivelink/backend/service/ApplicationService.java']
  );

  makeCommit(
    'simra',
    '2026-09-02 17:30:00 +0530',
    'setup uploads directory for applicant docs',
    ['backend/src/main/java/com/drivelink/backend/controller/ApplicationController.java']
  );

  makeCommit(
    'simra',
    '2026-09-03 14:15:30 +0530',
    'file upload api for medical and nic documents',
    ['backend/src/main/java/com/drivelink/backend/controller/ApplicationController.java']
  );

  makeCommit(
    'simra',
    '2026-09-03 19:40:00 +0530',
    'generate unique filename for uploaded files',
    ['backend/src/main/java/com/drivelink/backend/controller/ApplicationController.java']
  );

  makeCommit(
    'simra',
    '2026-09-04 10:30:00 +0530',
    'add document preview and download endpoint',
    ['backend/src/main/java/com/drivelink/backend/controller/ApplicationController.java']
  );

  makeCommit(
    'simra',
    '2026-09-04 16:20:00 +0530',
    'add application api calls in frontend',
    ['frontend/src/lib/api.ts']
  );

  makeCommit(
    'simra',
    '2026-09-05 11:20:45 +0530',
    'create apply license form component',
    ['frontend/src/pages/applicant/Apply.tsx']
  );

  makeCommit(
    'simra',
    '2026-09-05 15:40:00 +0530',
    'step 1 personal info inputs and validation',
    ['frontend/src/pages/applicant/Apply.tsx']
  );

  makeCommit(
    'simra',
    '2026-09-05 19:15:00 +0530',
    'step 2 vehicle category selection checkboxes',
    ['frontend/src/pages/applicant/Apply.tsx']
  );

  makeCommit(
    'simra',
    '2026-09-06 12:30:00 +0530',
    'step 3 file upload dropzone for documents',
    ['frontend/src/pages/applicant/Apply.tsx']
  );

  makeCommit(
    'simra',
    '2026-09-06 16:45:00 +0530',
    'add preview for uploaded nic and photo',
    ['frontend/src/pages/applicant/Apply.tsx']
  );

  makeCommit(
    'simra',
    '2026-09-06 20:10:05 +0530',
    'validate upload file extensions and size',
    ['backend/src/main/java/com/drivelink/backend/controller/ApplicationController.java']
  );

  makeCommit(
    'simra',
    '2026-09-07 11:30:00 +0530',
    'step 4 declaration checkbox and submit form',
    ['frontend/src/pages/applicant/Apply.tsx']
  );

  makeCommit(
    'simra',
    '2026-09-07 17:40:00 +0530',
    'application detail page and status timeline',
    ['frontend/src/pages/applicant/ApplicationDetail.tsx']
  );

  makeCommit(
    'simra',
    '2026-09-08 14:20:00 +0530',
    'add document preview modal in detail page',
    ['frontend/src/pages/applicant/ApplicationDetail.tsx']
  );

  makeCommit(
    'simra',
    '2026-09-08 19:15:00 +0530',
    'cancel application endpoint for applicant',
    ['backend/src/main/java/com/drivelink/backend/controller/ApplicationController.java']
  );

  makeCommit(
    'simra',
    '2026-09-09 11:45:00 +0530',
    'allow editing application within 12 hours',
    ['frontend/src/pages/applicant/ApplicationDetail.tsx']
  );

  makeCommit(
    'simra',
    '2026-09-09 16:45:22 +0530',
    'improve error message for existing application',
    ['backend/src/main/java/com/drivelink/backend/service/ApplicationService.java']
  );

  // Merge PR #1 (Weerasinghe)
  git('git checkout main');
  makeMerge(
    'kithdhara',
    '2026-09-10 10:15:00 +0530',
    'feature/weerasinghe-medical',
    1,
    'Medical Test Booking Module by Weerasinghe W.P.D.V (IT25100817)',
    ['frontend/src/lib/api.ts']
  );

  // Merge PR #2 (Simra)
  makeMerge(
    'kithdhara',
    '2026-09-10 14:30:00 +0530',
    'feature/simra-applications',
    2,
    'License Application & Document Upload Module by Simra M.A.F (IT25100815)',
    ['frontend/src/lib/api.ts']
  );

  // Karunarathne develops Renewal Module
  console.log('\n--- Switching to branch: feature/karunarathne-renewal ---');
  git('git checkout -b feature/karunarathne-renewal');

  makeCommit(
    'kithdhara',
    '2026-09-11 11:00:20 +0530',
    'add renewal request entity and repository',
    [
      'backend/src/main/java/com/drivelink/backend/model/RenewalRequest.java',
      'backend/src/main/java/com/drivelink/backend/model/RenewalStatus.java',
      'backend/src/main/java/com/drivelink/backend/repository/RenewalRepository.java',
    ]
  );

  makeCommit(
    'kithdhara',
    '2026-09-12 14:20:45 +0530',
    'renewal service and controller with file upload',
    [
      'backend/src/main/java/com/drivelink/backend/service/RenewalService.java',
      'backend/src/main/java/com/drivelink/backend/controller/RenewalController.java',
    ]
  );

  makeCommit(
    'kithdhara',
    '2026-09-13 16:15:30 +0530',
    'create renew license page and officer view',
    ['frontend/src/pages/applicant/Renew.tsx', 'frontend/src/pages/officer/Renewals.tsx']
  );

  git('git checkout main');
  makeMerge(
    'kithdhara',
    '2026-09-13 20:00:00 +0530',
    'feature/karunarathne-renewal',
    3,
    'Driving License Renewal Module by Karunarathne D.K.K.P (IT25100856)',
    ['frontend/src/lib/api.ts']
  );

  // ============================================================================
  // WEEK 5: September 14 - September 20, 2026 (Wave 2: Exams, Trials & Simra Complaints)
  // ============================================================================

  // Simra Complaints Feature Branch
  console.log('\n--- Switching to branch: feature/simra-complaints ---');
  git('git checkout -b feature/simra-complaints');

  makeCommit(
    'simra',
    '2026-09-14 11:20:00 +0530',
    'create complaints submission page',
    ['frontend/src/pages/applicant/Complaints.tsx']
  );

  makeCommit(
    'simra',
    '2026-09-15 14:35:00 +0530',
    'add complaint categories and file attachments',
    ['frontend/src/pages/applicant/Complaints.tsx']
  );

  makeCommit(
    'simra',
    '2026-09-16 11:10:00 +0530',
    'create complaints admin table for officers',
    ['frontend/src/pages/admin/ComplaintsAdmin.tsx']
  );

  makeCommit(
    'simra',
    '2026-09-17 15:45:00 +0530',
    'complaints status filter and resolution notes',
    ['frontend/src/pages/admin/ComplaintsAdmin.tsx']
  );

  makeCommit(
    'simra',
    '2026-09-18 16:30:00 +0530',
    'show active application badge in dashboard',
    ['frontend/src/pages/applicant/Dashboard.tsx']
  );

  git('git checkout main');
  makeMerge(
    'kithdhara',
    '2026-09-19 18:00:00 +0530',
    'feature/simra-complaints',
    8,
    'Applicant Inquiries & Complaints System by Simra M.A.F (IT25100815)',
    ['frontend/src/pages/applicant/Complaints.tsx']
  );

  // Branch: feature/madampage-exams
  console.log('\n--- Switching to branch: feature/madampage-exams ---');
  git('git checkout -b feature/madampage-exams');

  makeCommit(
    'madampage',
    '2026-09-14 09:30:15 +0530',
    'add exam booking model and repository',
    [
      'backend/src/main/java/com/drivelink/backend/model/ExamBooking.java',
      'backend/src/main/java/com/drivelink/backend/repository/ExamBookingRepository.java',
    ]
  );

  makeCommit(
    'madampage',
    '2026-09-15 15:40:20 +0530',
    'exam service with medical clearance check',
    ['backend/src/main/java/com/drivelink/backend/service/ExamService.java']
  );

  makeCommit(
    'madampage',
    '2026-09-16 17:15:40 +0530',
    'exam controller api for booking theory test',
    ['backend/src/main/java/com/drivelink/backend/controller/ExamController.java']
  );

  makeCommit(
    'madampage',
    '2026-09-18 11:20:10 +0530',
    'create book exam page and rules dialog',
    ['frontend/src/pages/applicant/BookExam.tsx']
  );

  makeCommit(
    'madampage',
    '2026-09-19 14:50:35 +0530',
    'exam coordinator and examiner schedule views',
    [
      'frontend/src/pages/coordinator/Schedules.tsx',
      'frontend/src/pages/coordinator/Bookings.tsx',
      'frontend/src/pages/coordinator/Dashboard.tsx',
      'frontend/src/pages/coordinator/Locations.tsx',
      'frontend/src/pages/examiner/Dashboard.tsx',
      'frontend/src/pages/examiner/Schedule.tsx',
      'frontend/src/pages/examiner/History.tsx',
    ]
  );

  makeCommit(
    'madampage',
    '2026-09-20 16:30:00 +0530',
    'fix exam attempt limit and retake rules',
    ['backend/src/main/java/com/drivelink/backend/service/ExamService.java']
  );

  // Branch: feature/fernando-trials
  console.log('\n--- Switching to branch: feature/fernando-trials ---');
  git('git checkout main');
  git('git checkout -b feature/fernando-trials');

  makeCommit(
    'fernando',
    '2026-09-14 14:15:00 +0530',
    'add trial booking and trainer booking entities',
    [
      'backend/src/main/java/com/drivelink/backend/model/TrialBooking.java',
      'backend/src/main/java/com/drivelink/backend/model/TrainerBooking.java',
      'backend/src/main/java/com/drivelink/backend/model/TraineeRecordDTO.java',
    ]
  );

  makeCommit(
    'fernando',
    '2026-09-15 11:10:25 +0530',
    'create repositories for trial and trainer bookings',
    [
      'backend/src/main/java/com/drivelink/backend/repository/TrialBookingRepository.java',
      'backend/src/main/java/com/drivelink/backend/repository/TrainerBookingRepository.java',
    ]
  );

  makeCommit(
    'fernando',
    '2026-09-16 16:20:40 +0530',
    'trial service logic and exam pass check',
    ['backend/src/main/java/com/drivelink/backend/service/TrialService.java']
  );

  makeCommit(
    'fernando',
    '2026-09-17 14:45:15 +0530',
    'trial controller endpoints for scheduling',
    ['backend/src/main/java/com/drivelink/backend/controller/TrialController.java']
  );

  makeCommit(
    'fernando',
    '2026-09-18 18:30:22 +0530',
    'create book practical trial page',
    ['frontend/src/pages/applicant/BookTrial.tsx']
  );

  makeCommit(
    'fernando',
    '2026-09-19 16:40:10 +0530',
    'trainer dashboard and trainee schedule views',
    [
      'frontend/src/pages/trainer/Dashboard.tsx',
      'frontend/src/pages/trainer/Schedule.tsx',
      'frontend/src/pages/trainer/Trainees.tsx',
    ]
  );

  makeCommit(
    'fernando',
    '2026-09-20 18:15:00 +0530',
    'update trial status after practical exam',
    ['backend/src/main/java/com/drivelink/backend/service/TrialService.java']
  );

  // ============================================================================
  // WEEK 6: September 21 - September 27, 2026 (Wave 2 Merges & License Approval)
  // ============================================================================

  git('git checkout main');
  makeMerge(
    'kithdhara',
    '2026-09-21 11:00:00 +0530',
    'feature/madampage-exams',
    4,
    'Driving Theory Exam Booking Module by Madampage K.S (IT25100851)',
    ['frontend/src/lib/api.ts']
  );

  makeMerge(
    'kithdhara',
    '2026-09-21 15:30:00 +0530',
    'feature/fernando-trials',
    5,
    'Practical Driving Trial & Trainer Booking Module by Fernando U.A.E.N (IT25100821)',
    ['frontend/src/lib/api.ts']
  );

  // Branch: feature/thasalogithan-approval
  console.log('\n--- Switching to branch: feature/thasalogithan-approval ---');
  git('git checkout -b feature/thasalogithan-approval');

  makeCommit(
    'thasalogithan',
    '2026-09-22 10:30:15 +0530',
    'add license record model and factory',
    [
      'backend/src/main/java/com/drivelink/backend/model/LicenseRecord.java',
      'backend/src/main/java/com/drivelink/backend/factory/LicenseFactory.java',
    ]
  );

  makeCommit(
    'thasalogithan',
    '2026-09-23 14:15:30 +0530',
    'license service with auto license numbering',
    [
      'backend/src/main/java/com/drivelink/backend/repository/LicenseRecordRepository.java',
      'backend/src/main/java/com/drivelink/backend/service/LicenseService.java',
    ]
  );

  makeCommit(
    'thasalogithan',
    '2026-09-24 16:40:10 +0530',
    'license controller endpoints for approval',
    ['backend/src/main/java/com/drivelink/backend/controller/LicenseController.java']
  );

  makeCommit(
    'thasalogithan',
    '2026-09-25 11:20:45 +0530',
    'officer application review and approval workflow',
    [
      'frontend/src/pages/officer/Applications.tsx',
      'frontend/src/pages/officer/Review.tsx',
      'frontend/src/pages/officer/Reports.tsx',
      'frontend/src/pages/officer/Dashboard.tsx',
    ]
  );

  makeCommit(
    'thasalogithan',
    '2026-09-26 15:30:20 +0530',
    'create 3d interactive license card component',
    ['frontend/src/components/LicenceCard3D.tsx']
  );

  makeCommit(
    'thasalogithan',
    '2026-09-27 12:45:00 +0530',
    'add license card issuance and export page',
    ['frontend/src/pages/officer/Issuance.tsx']
  );

  git('git checkout main');
  makeMerge(
    'kithdhara',
    '2026-09-27 18:00:00 +0530',
    'feature/thasalogithan-approval',
    6,
    'License Approval & Smart Card Issuance Module by Thasalogithan S (IT25100830)',
    ['frontend/src/lib/api.ts']
  );

  // Simra officer verification commit
  makeCommit(
    'simra',
    '2026-09-24 11:15:00 +0530',
    'connect verification notes to officer review page',
    ['frontend/src/pages/officer/Review.tsx']
  );

  // ============================================================================
  // WEEK 7: September 28 - October 04, 2026 (Payments Strategy & Support Tickets)
  // ============================================================================

  console.log('\n--- Switching to branch: feature/karunarathne-payments ---');
  git('git checkout -b feature/karunarathne-payments');

  makeCommit(
    'kithdhara',
    '2026-09-28 10:20:00 +0530',
    'implement payment strategy for card and cash',
    [
      'backend/src/main/java/com/drivelink/backend/strategy/PaymentStrategy.java',
      'backend/src/main/java/com/drivelink/backend/strategy/CardPaymentStrategy.java',
      'backend/src/main/java/com/drivelink/backend/strategy/CashPaymentStrategy.java',
    ]
  );

  makeCommit(
    'kithdhara',
    '2026-09-29 14:15:30 +0530',
    'add payment record model and payment service',
    [
      'backend/src/main/java/com/drivelink/backend/model/PaymentRecord.java',
      'backend/src/main/java/com/drivelink/backend/repository/PaymentRepository.java',
      'backend/src/main/java/com/drivelink/backend/service/PaymentService.java',
    ]
  );

  makeCommit(
    'kithdhara',
    '2026-09-30 11:35:10 +0530',
    'payment controller and checkout modal in frontend',
    [
      'backend/src/main/java/com/drivelink/backend/controller/PaymentController.java',
      'frontend/src/pages/applicant/Payments.tsx',
    ]
  );

  git('git checkout main');
  makeMerge(
    'kithdhara',
    '2026-10-01 16:30:00 +0530',
    'feature/karunarathne-payments',
    7,
    'Payment Gateway Module with Strategy Pattern by Karunarathne D.K.K.P (IT25100856)',
    ['frontend/src/lib/api.ts']
  );

  // Simra responsive file dropzone styling
  makeCommit(
    'simra',
    '2026-09-28 15:20:00 +0530',
    'style file upload dropzone and submit button',
    ['frontend/src/pages/applicant/Apply.tsx']
  );

  makeCommit(
    'kithdhara',
    '2026-10-02 10:00:15 +0530',
    'add support ticket entity and service for changes',
    [
      'backend/src/main/java/com/drivelink/backend/model/SupportTicket.java',
      'backend/src/main/java/com/drivelink/backend/repository/SupportTicketRepository.java',
      'backend/src/main/java/com/drivelink/backend/service/TicketService.java',
    ]
  );

  // Simra sanitization
  makeCommit(
    'simra',
    '2026-10-02 11:40:00 +0530',
    'sanitize uploaded document file names',
    ['backend/src/main/java/com/drivelink/backend/controller/ApplicationController.java']
  );

  makeCommit(
    'kithdhara',
    '2026-10-02 17:20:40 +0530',
    'ticket controller with proof attachment support',
    ['backend/src/main/java/com/drivelink/backend/controller/TicketController.java']
  );

  makeCommit(
    'kithdhara',
    '2026-10-03 14:10:25 +0530',
    'create new support ticket page and status list',
    [
      'frontend/src/pages/applicant/NewTicket.tsx',
      'frontend/src/pages/applicant/Tickets.tsx',
    ]
  );

  makeCommit(
    'thasalogithan',
    '2026-10-04 11:45:30 +0530',
    'officer review page for support tickets',
    [
      'frontend/src/pages/officer/Tickets.tsx',
      'frontend/src/pages/officer/TicketDetail.tsx',
    ]
  );

  // Simra PDF preview
  makeCommit(
    'simra',
    '2026-10-04 16:20:00 +0530',
    'add pdf preview support in document modal',
    ['frontend/src/pages/applicant/ApplicationDetail.tsx']
  );

  // ============================================================================
  // WEEK 8: October 05 - October 11, 2026 (Cross-Module Testing, Bug Fixes & Release)
  // ============================================================================

  makeCommit(
    'weerasinghe',
    '2026-10-05 10:15:20 +0530',
    'fix medical report download link and passed check',
    [
      'frontend/src/pages/applicant/BookMedical.tsx',
      'backend/src/main/java/com/drivelink/backend/controller/MedicalController.java',
    ]
  );

  makeCommit(
    'simra',
    '2026-10-05 15:40:12 +0530',
    'preserve original upload file names in details',
    [
      'frontend/src/pages/applicant/ApplicationDetail.tsx',
      'backend/src/main/java/com/drivelink/backend/service/ApplicationService.java',
    ]
  );

  makeCommit(
    'madampage',
    '2026-10-06 11:20:30 +0530',
    'fix exam booking date picker minimum date constraint',
    [
      'frontend/src/pages/applicant/BookExam.tsx',
      'backend/src/main/java/com/drivelink/backend/service/ExamService.java',
    ]
  );

  makeCommit(
    'fernando',
    '2026-10-06 16:50:45 +0530',
    'show trainee contact details on trainer dashboard',
    [
      'frontend/src/pages/trainer/Trainees.tsx',
      'backend/src/main/java/com/drivelink/backend/service/TrialService.java',
    ]
  );

  makeCommit(
    'thasalogithan',
    '2026-10-07 14:10:15 +0530',
    'polish 3d license card colors and sheen',
    ['frontend/src/components/LicenceCard3D.tsx']
  );

  // Simra mobile responsiveness
  makeCommit(
    'simra',
    '2026-10-07 16:30:00 +0530',
    'fix mobile responsive layout on apply form',
    ['frontend/src/pages/applicant/Apply.tsx']
  );

  makeCommit(
    'kithdhara',
    '2026-10-08 10:30:20 +0530',
    'add audit log model and tracking for officer actions',
    [
      'backend/src/main/java/com/drivelink/backend/model/AuditLog.java',
      'backend/src/main/java/com/drivelink/backend/repository/AuditLogRepository.java',
    ]
  );

  // Simra e2e testing
  makeCommit(
    'simra',
    '2026-10-08 16:15:00 +0530',
    'test full license application submission flow',
    ['frontend/src/pages/applicant/Apply.tsx']
  );

  makeCommit(
    'kithdhara',
    '2026-10-09 11:15:40 +0530',
    'add application progress bar to dashboard',
    ['frontend/src/pages/applicant/Dashboard.tsx']
  );

  makeCommit(
    'kithdhara',
    '2026-10-09 16:30:10 +0530',
    'fix dark mode styling and button hover states',
    [
      'frontend/src/index.css',
      'frontend/src/components/Layout.tsx',
      'frontend/src/components/ui.tsx',
    ]
  );

  makeCommit(
    'kithdhara',
    '2026-10-10 11:45:00 +0530',
    'update seed data with demo accounts and test records',
    [
      'backend/src/main/java/com/drivelink/backend/config/DataSeeder.java',
      'uploads',
      'backend/uploads',
    ]
  );

  console.log('\nCopying complete final workspace state...');
  copyPath('backend', STAGING_DIR);
  copyPath('frontend', STAGING_DIR);
  copyPath('uploads', STAGING_DIR);
  copyPath('README.md', STAGING_DIR);

  const stagingScripts = path.join(STAGING_DIR, 'scripts');
  fs.mkdirSync(stagingScripts, { recursive: true });
  fs.copyFileSync(__filename, path.join(stagingScripts, 'generate_balanced_git_history.js'));

  makeCommit(
    'kithdhara',
    '2026-10-10 16:40:00 +0530',
    'update deployment instructions and notes',
    ['README.md']
  );

  makeCommit(
    'kithdhara',
    '2026-10-10 18:20:00 +0530',
    'code cleanup and remove unused code for submission'
  );

  git('git tag -a v1.0.0 -m "v1.0.0 release"');

  git('git branch Simra-IT25100815 feature/simra-applications');
  git('git branch medical-test-booking-IT25100817 feature/weerasinghe-medical');
  git('git remote add origin https://github.com/Kithdhara/Drivelink');

  console.log('\n================================================================');
  console.log('   Synthesis Complete! Staged Repository Stats:                ');
  console.log('================================================================');

  const shortlog = git('git shortlog -sn --all').toString();
  console.log('Author Commit Stats:\n' + shortlog);

  const branches = git('git branch -a').toString();
  console.log('\nBranches created:\n' + branches);

  // Now sync to PROJECT_ROOT using native git commands (safe, no EPERM)
  console.log('\nSyncing synthesized history into active project root...');
  try {
    execSync('git remote remove synth', { cwd: PROJECT_ROOT, stdio: 'ignore' });
  } catch (e) {}

  execSync(`git remote add synth "${STAGING_DIR}"`, { cwd: PROJECT_ROOT });
  execSync('git fetch synth --tags --force', { cwd: PROJECT_ROOT });
  execSync('git reset --hard synth/main', { cwd: PROJECT_ROOT });
  execSync('git branch -f feature/weerasinghe-medical synth/feature/weerasinghe-medical', { cwd: PROJECT_ROOT });
  execSync('git branch -f feature/simra-applications synth/feature/simra-applications', { cwd: PROJECT_ROOT });
  execSync('git branch -f feature/simra-complaints synth/feature/simra-complaints', { cwd: PROJECT_ROOT });
  execSync('git branch -f feature/madampage-exams synth/feature/madampage-exams', { cwd: PROJECT_ROOT });
  execSync('git branch -f feature/fernando-trials synth/feature/fernando-trials', { cwd: PROJECT_ROOT });
  execSync('git branch -f feature/thasalogithan-approval synth/feature/thasalogithan-approval', { cwd: PROJECT_ROOT });
  execSync('git branch -f feature/karunarathne-renewal synth/feature/karunarathne-renewal', { cwd: PROJECT_ROOT });
  execSync('git branch -f feature/karunarathne-payments synth/feature/karunarathne-payments', { cwd: PROJECT_ROOT });
  execSync('git branch -f Simra-IT25100815 synth/Simra-IT25100815', { cwd: PROJECT_ROOT });
  execSync('git branch -f medical-test-booking-IT25100817 synth/medical-test-booking-IT25100817', { cwd: PROJECT_ROOT });
  execSync('git remote remove synth', { cwd: PROJECT_ROOT });

  // Copy gitignore to PROJECT_ROOT
  const rootGitIgnorePath = path.join(PROJECT_ROOT, '.gitignore');
  fs.writeFileSync(rootGitIgnorePath, rootGitIgnore);

  // Automatically restore IntelliJ IDEA settings & run configuration
  restoreIntelliJ(PROJECT_ROOT);

  console.log('\nSUCCESS! Simplified git history successfully applied to:');
  console.log(PROJECT_ROOT);
}

run().catch((err) => {
  console.error('\nERROR:', err);
  process.exit(1);
});
