pipeline {

    agent any

    options {
        timestamps()
        skipDefaultCheckout(true)
        // Stop later stages if a publisher marks the build UNSTABLE/FAILURE mid-run
        skipStagesAfterUnstable()
    }

    environment {
        // Folder proyek kalau repo punya folder bersarang dengan nama yang sama.
        // Kalau folder ini tidak ada, otomatis dipakai root repo ('.').
        NESTED_DIR = 'ifs24026-pabwe2026-sk-p6-svelte'
    }

    stages {

        // ============================================================
        // CHECKOUT
        // ============================================================
        stage('Checkout') {
            agent {
                docker {
                    image 'oven/bun:alpine'
                    reuseNode true
                }
            }

            steps {
                checkout scm

                script {
                    // Deteksi lokasi package.json proyek
                    if (fileExists("${env.NESTED_DIR}/package.json")) {
                        env.APP_DIR = env.NESTED_DIR
                    } else {
                        env.APP_DIR = '.'
                    }

                    echo "APP_DIR = ${env.APP_DIR}"
                }

                sh '''
                    echo "=== Isi APP_DIR ($APP_DIR) ==="
                    ls -la "$APP_DIR"
                '''
            }
        }

        // ============================================================
        // INSTALL DEPENDENCIES
        // ============================================================
        stage('Install Dependencies') {
            agent {
                docker {
                    image 'oven/bun:alpine'
                    reuseNode true
                }
            }

            steps {
                dir(env.APP_DIR) {
                    sh '''
                        set -e

                        echo "=== Installing Dependencies ==="

                        bun install

                        echo "=== Dependencies Installed ==="
                    '''
                }
            }
        }

        // ============================================================
        // TEST
        // ============================================================
        stage('Test') {
            agent {
                docker {
                    image 'node:24-alpine'
                    reuseNode true
                }
            }

            environment {
                // Cadangan agar resolveAssetUrl tidak error "Invalid URL" di CI
                VITE_DELCOM_BASEURL = 'https://example.com/api'
            }

            steps {
                dir(env.APP_DIR) {
                    sh '''
                        set -e

                        echo "=== Running Tests with Coverage ==="

                        npx vitest run --coverage

                        echo "=== Tests Passed ==="
                    '''
                }
            }
        }

        // ============================================================
        // TRIVY SECURITY SCAN
        // ============================================================
        stage('Trivy Security Scan') {
            agent {
                docker {
                    image 'aquasec/trivy:0.74.0'
                    reuseNode true

                    args '''
                        --entrypoint=""
                        -e HOME=/tmp
                        -e XDG_CACHE_HOME=/tmp/.cache
                    '''
                }
            }

            steps {
                sh '''
                    set -e

                    ROOT="$(pwd)"

                    mkdir -p "$ROOT/.trivy-cache" || true

                    echo "======================================"
                    echo "        TRIVY SECURITY SCAN"
                    echo "======================================"

                    echo "=== Trivy Version ==="
                    trivy --version

                    echo "=== Trivy Scan ==="

                    cd "$APP_DIR"

                    trivy fs \
                        --cache-dir "$ROOT/.trivy-cache" \
                        --scanners vuln \
                        --severity HIGH,CRITICAL \
                        --format sarif \
                        --output "$ROOT/trivy-results.sarif" \
                        --exit-code 1 \
                        .

                    echo "=== Trivy Result ==="
                    ls -lh "$ROOT/trivy-results.sarif"
                '''
            }

            post {
                always {
                    // failOnError must be false: otherwise Warnings NG can mark the
                    // whole build FAILURE while later stages still run (all green, badge red).
                    // Build failure on HIGH/CRITICAL comes from trivy --exit-code 1 above.
                    recordIssues(
                        enabledForFailure: true,
                        failOnError: false,
                        tools: [
                            sarif(
                                id: 'trivy',
                                name: 'Trivy Security',
                                pattern: 'trivy-results.sarif'
                            )
                        ]
                    )
                }
            }
        }

        // ============================================================
        // SONARQUBE ANALYSIS
        // ============================================================
        stage('SonarQube Analysis') {
            agent {
                docker {
                    image 'sonarsource/sonar-scanner-cli:latest'
                    reuseNode true
                    args '--network cicd-network'
                }
            }

            steps {
                dir(env.APP_DIR) {
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            set -e

                            echo "=== SonarQube Analysis ==="

                            sonar-scanner

                            echo "=== SonarQube Analysis Completed ==="
                        '''
                    }
                }
            }
        }

        // ============================================================
        // QUALITY GATE
        // ============================================================
        stage('Quality Gate') {
            steps {
                timeout(time: 30, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ============================================================
        // PACKAGE APPLICATION
        // ============================================================
        stage('Package Application') {
            agent {
                docker {
                    image 'node:24-alpine'
                    reuseNode true
                    args '-u root'
                }
            }

            steps {
                sh '''
                    set -e

                    echo "======================================"
                    echo "       CREATING APPLICATION PACKAGE"
                    echo "======================================"

                    apk add --no-cache zip unzip

                    ROOT="$(pwd)"

                    rm -f "$ROOT/latest-app.zip"

                    cd "$APP_DIR"

                    zip -r "$ROOT/latest-app.zip" . \
                        -x "node_modules/*" \
                        -x ".git/*" \
                        -x ".env" \
                        -x ".env.*" \
                        -x "coverage/*" \
                        -x "dist/*" \
                        -x "out/*" \
                        -x ".trivy-cache/*" \
                        -x "latest-app.zip" \
                        -x "trivy-results.sarif" \
                        -x ".docs/*"

                    cd "$ROOT"

                    echo "=== Application Package Created ==="

                    ls -lh latest-app.zip

                    echo "=== Package Content ==="

                    unzip -l latest-app.zip
                '''
            }
        }

        // ============================================================
        // PUBLISH APPLICATION
        // ============================================================
        stage('Publish Application') {

            steps {

                // ========================================================
                // 1. ARCHIVE ARTIFACT KE JENKINS
                // ========================================================

                archiveArtifacts(
                    artifacts: 'latest-app.zip',
                    fingerprint: true,
                    allowEmptyArchive: false
                )

                script {

                    // ====================================================
                    // 2. BUAT IDENTITAS APPLICATION
                    // ====================================================

                    def appName = env.JOB_NAME
                        .replaceAll('[^a-zA-Z0-9._-]', '-')
                        .replaceAll('-+', '-')
                        .replaceAll('^-|-$', '')

                    def buildId = env.BUILD_NUMBER

                    echo "Application Name: ${appName}"
                    echo "Build ID: ${buildId}"

                    // ====================================================
                    // 3. COPY KE USER CONTENT
                    // ====================================================

                    sh """
                        set -e

                        echo "======================================"
                        echo "       PUBLISHING USER CONTENT"
                        echo "======================================"

                        docker exec cicd-jenkins \
                            mkdir -p \
                            "/var/jenkins_home/userContent/applications/${appName}/${buildId}"

                        docker cp \
                            latest-app.zip \
                            "cicd-jenkins:/var/jenkins_home/userContent/applications/${appName}/${buildId}/latest-app.zip"

                        echo "=== Published File ==="

                        docker exec cicd-jenkins \
                            ls -lh \
                            "/var/jenkins_home/userContent/applications/${appName}/${buildId}/latest-app.zip"
                    """

                    // ====================================================
                    // 4. BUAT PUBLIC ARTIFACT URL
                    // ====================================================

                    def jenkinsBaseUrl = env.BUILD_URL
                        .substring(0, env.BUILD_URL.indexOf('/job/'))
                        .replace('localhost', 'host.docker.internal')

                    env.ARTIFACT_URL =
                        "${jenkinsBaseUrl}/userContent/applications/${appName}/${buildId}/latest-app.zip"

                    echo "======================================"
                    echo "       APPLICATION PUBLISHED"
                    echo "======================================"

                    echo "Artifact URL:"
                    echo "${env.ARTIFACT_URL}"
                }
            }
        }

        // ============================================================
        // DEPLOY APPLICATION
        // ============================================================
        stage('Deploy Application') {
            agent {
                docker {
                    image 'curlimages/curl:8.15.0'
                    reuseNode true
                    args '--network cicd-network'
                }
            }

            steps {
                script {

                    echo "=========================================="
                    echo "       START APPLICATION DEPLOYMENT"
                    echo "=========================================="

                    echo "Artifact URL:"
                    echo "${env.ARTIFACT_URL}"

                    // ==================================================
                    // 1. REQUEST REDEPLOYMENT
                    // ==================================================

                    echo ""
                    echo "=== Request Redeployment ==="

                    def redeployResponse = sh(
                        script: '''
                            set -e

                            curl -sS --fail-with-body \
                                -X POST "$URL_REDEPLOY" \
                                -H "Content-Type: application/json" \
                                -d "{
                                    \\"token_access\\": \\"$DEPLOY_TOKEN\\",
                                    \\"website_id\\": \\"$WEBSITE_ID\\",
                                    \\"source_url\\": \\"$ARTIFACT_URL\\",
                                    \\"source_type\\": \\"jenkins\\"
                                }"
                        ''',
                        returnStdout: true
                    ).trim()

                    echo "Redeploy Response:"
                    echo redeployResponse

                    // ==================================================
                    // 2. POLLING DEPLOYMENT PROGRESS
                    // ==================================================

                    echo ""
                    echo "=== Waiting For Deployment ==="

                    def maxAttempts = 120
                    def attempt = 0
                    def deploymentStatus = 'IN_PROGRESS'

                    while (deploymentStatus == 'IN_PROGRESS') {

                        attempt++

                        if (attempt > maxAttempts) {
                            error(
                                "Deployment timeout. " +
                                "Status masih IN_PROGRESS setelah " +
                                "${maxAttempts} attempts."
                            )
                        }

                        sleep time: 5, unit: 'SECONDS'

                        echo ""
                        echo "=== Checking Deployment Progress (${attempt}/${maxAttempts}) ==="

                        def progressResponse = sh(
                            script: '''
                                set -e

                                curl -sS --fail-with-body \
                                    -X POST "$URL_PROGRESS" \
                                    -H "Content-Type: application/json" \
                                    -d "{
                                        \\"token_access\\": \\"$DEPLOY_TOKEN\\",
                                        \\"website_id\\": \\"$WEBSITE_ID\\"
                                    }"
                            ''',
                            returnStdout: true
                        ).trim()

                        echo "Progress Response:"
                        echo progressResponse

                        // ==================================================
                        // PARSE JSON
                        // ==================================================

                        def json = readJSON text: progressResponse

                        deploymentStatus = json?.data?.status
                            ?.toString()
                            ?.toUpperCase()

                        if (!deploymentStatus) {
                            error(
                                "Response progress tidak memiliki data.status"
                            )
                        }

                        echo "Deployment Status: ${deploymentStatus}"

                        // ==================================================
                        // SUCCESS
                        // ==================================================

                        if (deploymentStatus == 'SUCCESS') {

                            echo ""
                            echo "=========================================="
                            echo "       ✅ DEPLOYMENT SUCCESS"
                            echo "=========================================="

                            break
                        }

                        // ==================================================
                        // FAIL
                        // ==================================================

                        if (deploymentStatus == 'FAIL') {

                            echo ""
                            echo "=========================================="
                            echo "       ❌ DEPLOYMENT FAILED"
                            echo "=========================================="

                            def deploymentLog =
                                json?.data?.log
                                    ?: 'Deployment failed tanpa log.'

                            echo ""
                            echo "========== DEPLOYMENT LOG =========="
                            echo deploymentLog
                            echo "===================================="

                            error(
                                "Deployment gagal untuk website " +
                                "${WEBSITE_ID}"
                            )
                        }

                        // ==================================================
                        // OTHER STATUS
                        // ==================================================

                        echo "Deployment masih berjalan..."
                    }

                    echo ""
                    echo "=========================================="
                    echo "       DEPLOYMENT FINISHED"
                    echo "=========================================="
                }
            }
        }
    }

    // ================================================================
    // POST ACTIONS
    // ================================================================
    post {

        always {
            archiveArtifacts(
                artifacts: 'trivy-results.sarif',
                allowEmptyArchive: true
            )
        }

        success {
            echo "=========================================="
            echo "       ✅ PIPELINE SUCCESS"
            echo "=========================================="
            echo "Result: ${currentBuild.currentResult}"
            echo "📦 Artifact: ${env.ARTIFACT_URL ?: '(not published)'}"
            echo "🚀 Website berhasil dideploy."
        }

        failure {
            echo "=========================================="
            echo "       ❌ PIPELINE FAILED"
            echo "=========================================="
            echo "Result: ${currentBuild.currentResult}"
            echo "Periksa log stage yang merah / Console Output untuk penyebab gagal."
        }

        unstable {
            echo "=========================================="
            echo "       ⚠️ PIPELINE UNSTABLE"
            echo "=========================================="
            echo "Result: ${currentBuild.currentResult}"
        }
    }
}