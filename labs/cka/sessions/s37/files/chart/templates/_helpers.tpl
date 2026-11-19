{{/* Probe, preStop và cổng chung của ba service Spring Boot (giống hệt manifest rời trước s37). */}}
{{- define "shop.springContainer" -}}
ports:
- name: http
  containerPort: 8080
  protocol: TCP
startupProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 5
  failureThreshold: 30
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
lifecycle:
  preStop:
    exec:
      command:
      - sleep
      - "10"
{{- end }}

{{/* Service ClusterIP cổng http 8080 → targetPort http. Gọi: include "shop.service" "gateway" */}}
{{- define "shop.service" -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ . }}
  labels:
    app: {{ . }}
spec:
  type: ClusterIP
  selector:
    app: {{ . }}
  ports:
  - name: http
    port: 8080
    targetPort: http
    protocol: TCP
{{- end }}

{{/* Biến DB của catalog và order: DB_URL thẳng, user/mật khẩu từ Secret ngoài chart. */}}
{{- define "shop.dbEnv" -}}
- name: DB_URL
  value: {{ .Values.db.url }}
- name: DB_USER
  valueFrom:
    secretKeyRef:
      name: {{ .Values.db.secret }}
      key: DB_USER
- name: DB_PASSWORD
  valueFrom:
    secretKeyRef:
      name: {{ .Values.db.secret }}
      key: DB_PASSWORD
{{- end }}
