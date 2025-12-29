"use client";

import React from "react";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/outline";

export default function FaqItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-left font-bold text-gray-900 hover:bg-gray-50 transition-colors text-lg"
            >
                <span dangerouslySetInnerHTML={{ __html: question }} />
                {isOpen ? (
                    <div className="bg-[#0037ff] text-white rounded-full p-1">
                        <MinusIcon className="w-5 h-5" />
                    </div>
                ) : (
                    <div className="bg-gray-100 text-gray-500 rounded-full p-1">
                        <PlusIcon className="w-5 h-5" />
                    </div>
                )}
            </button>
            {isOpen && (
                <div
                    className="p-6 pt-0 text-gray-600 leading-relaxed border-t border-gray-100"
                    dangerouslySetInnerHTML={{ __html: answer }}
                />
            )}
        </div>
    );
}
