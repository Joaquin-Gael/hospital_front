import { Component, type OnInit } from "@angular/core"
import { CommonModule } from "@angular/common"
import { FormsModule } from "@angular/forms"

interface Task {
  id: string
  title: string
  description: string
  dueDate: Date | null
  priority: "high" | "medium" | "low"
  completed: boolean
}

@Component({
  selector: "app-task-list",
  templateUrl: "./task-list.component.html",
  styleUrls: ["./task-list.component.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class TaskListComponent implements OnInit {
  tasks: Task[] = []
  filteredTasks: Task[] = []
  isLoading = true
  priorityFilter = "all"

  constructor() {}

  ngOnInit(): void {
    this.loadTasks()
  }

  loadTasks(): void {
    setTimeout(() => {
      this.tasks = [
        {
          id: "task-1",
          title: "Revisar resultados de laboratorio",
          description: "Revisar los resultados de laboratorio de María López y actualizar su historial.",
          dueDate: new Date(new Date().setHours(14, 0, 0, 0)),
          priority: "high",
          completed: false,
        },
        {
          id: "task-2",
          title: "Completar informe mensual",
          description: "Finalizar el informe mensual de pacientes atendidos para administración.",
          dueDate: new Date(new Date().setDate(new Date().getDate() + 2)),
          priority: "medium",
          completed: false,
        },
        {
          id: "task-3",
          title: "Actualizar protocolos",
          description: "Revisar y actualizar los protocolos de tratamiento para hipertensión.",
          dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
          priority: "low",
          completed: false,
        },
        {
          id: "task-4",
          title: "Llamar a paciente Juan Pérez",
          description: "Llamar para seguimiento post-operatorio.",
          dueDate: null,
          priority: "medium",
          completed: true,
        },
      ]

      this.applyFilters()
      this.isLoading = false
    }, 1000)
  }

  applyFilters(): void {
    this.filteredTasks = this.tasks.filter((task) => {
      if (this.priorityFilter === "all") {
        return true
      }
      return task.priority === this.priorityFilter
    })

    this.filteredTasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }


      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }

      if (a.priority !== b.priority) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }

      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1

      return a.dueDate.getTime() - b.dueDate.getTime()
    })
  }

  toggleTaskCompletion(taskId: string): void {
    const task = this.tasks.find((t) => t.id === taskId)
    if (task) {
      task.completed = !task.completed
      this.applyFilters()
    }
  }

  deleteTask(taskId: string): void {
    this.tasks = this.tasks.filter((t) => t.id !== taskId)
    this.applyFilters()
  }

  formatDueDate(date: Date | null): string {
    if (!date) {
      return "Sin fecha límite"
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const taskDate = new Date(date)
    taskDate.setHours(0, 0, 0, 0)

    if (taskDate.getTime() === today.getTime()) {
      return `Hoy a las ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      return `Mañana a las ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  getPriorityLabel(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      high: "Alta",
      medium: "Media",
      low: "Baja",
    }
    return priorityMap[priority] || priority
  }
}
