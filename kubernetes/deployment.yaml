---
apiVersion: networking.k8s.io/v1beta1
kind: Ingress
metadata:
  name: backend-ingress
spec:
  tls:
    - secretName: backend-secret-tls
  rules:
    - http:
        paths:
          - path: /*
            backend:
              serviceName: backend-service
              servicePort: 3000
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app: backend
  name: backend-service
spec:
  type: NodePort
  ports:
    - name: http
      port: 3000
      protocol: TCP
      targetPort: 3000
  selector:
    app: backend
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
  labels:
    app: backend
spec:
  replicas: 10
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: gcr.io/pxlblue/backend:latest
          imagePullPolicy: Always
          resources:
            requests:
              memory: "200M"
              cpu: "50m"
            limits:
              memory: "500M"
              cpu: "100m"
          ports:
            - containerPort: 3000
          env:
            - name: PORT
              value: "3000"
            - name: TYPEORM_CONNECTION
              value: postgres
            - name: TYPEORM_HOST
              value: "10.89.16.2"
            - name: TYPEORM_USERNAME
              value: pxl
            - name: TYPEORM_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: backend-secret
                  key: db-password
            - name: TYPEORM_DATABASE
              value: pxl
            - name: TYPEORM_PORT
              value: "5432"
            - name: TYPEORM_SYNCHRONIZE
              value: "true"
            - name: SECRET
              valueFrom:
                secretKeyRef:
                  name: backend-secret
                  key: secret
            - name: EMAIL_KEY
              valueFrom:
                secretKeyRef:
                  name: backend-secret
                  key: email-key
            - name: EMAIL_FROM
              value: noreply@pxl.blue
            - name: INVITES_DISABLED
              value: "0"
            - name: STORAGE_PROJECT
              value: pxlblue
            - name: STORAGE_BUCKET
              value: pxl-storage
            - name: STORAGE_EMAIL
              value: storage@pxlblue.iam.gserviceaccount.com
            - name: STORAGE_KEY
              valueFrom:
                secretKeyRef:
                  name: backend-secret
                  key: storage-key
            - name: DISCORD_INVITE
              value: "https://discord.gg/GdEWmU8"
            - name: MAIL_HOST
              value: "whistler.blizzard.to"
            - name: MAIL_USER
              value: "adminuser"
            - name: MAIL_PASS
              valueFrom:
                secretKeyRef:
                  name: backend-secret
                  key: mail-pass
            - name: MAIL_DB
              value: "mailserver"
            - name: BASE_URL
              value: "https://api.pxl.blue"
            - name: DISCORD_TOKEN
              valueFrom:
                secretKeyRef:
                  name: backend-secret
                  key: discord-token
            - name: DISCORD_CLIENT_ID
              value: "749963189285945424"
            - name: DISCORD_CLIENT_SECRET
              valueFrom:
                secretKeyRef:
                  name: backend-secret
                  key: discord-client-secret
            - name: DISCORD_GUILD
              value: "712886036312752210"
            - name: DISCORD_ROLE_MEMBER
              value: "712889806337867827"
            - name: LOGDNA_INGESTION_KEY
              valueFrom:
                secretKeyRef:
                  key: logdna-ingestion-key
                  name: backend-secret
            - name: SENTRY_DSN
              valueFrom:
                secretKeyRef:
                  name: backend-secret
                  key: sentry-dsn
            - name: SYNAPSE_URL
              valueFrom:
                secretKeyRef:
                  name: backend-secret
                  key: synapse-url
            - name: SYNAPSE_REGISTRATION_PSK
              valueFrom:
                secretKeyRef:
                  name: backend-secret
                  key: synapse-registration-psk
      terminationGracePeriodSeconds: 60
